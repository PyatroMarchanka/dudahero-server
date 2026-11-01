import mongoose from "mongoose";
import setupMongooseConnection from "../connect";
import { UserMelodyModel } from "../schemas/userMelody";
import { UserModel } from "../schemas/user";
import { IMelodyRoll, MelodyFormat, ReviewStatus } from "../../interfaces/userMelody";

// Melodies a single user may keep, so one account can't fill the database
export const MAX_MELODIES_PER_USER = 100;

const statusOf = (melody: any): ReviewStatus => melody.reviewStatus || "draft";

// What anyone with the link sees. Nothing here names an admin.
const toPublicMelody = (melody: any) => ({
  id: melody._id.toString(),
  title: melody.title,
  format: melody.format || "abc",
  abc: melody.abc,
  roll: melody.roll,
  reviewStatus: statusOf(melody),
  createdAt: melody.createdAt,
  updatedAt: melody.updatedAt,
});

// What the owner sees in their own list: also the review outcome
const toOwnerMelody = (melody: any) => ({
  ...toPublicMelody(melody),
  submittedAt: melody.submittedAt,
  reviewedAt: melody.reviewedAt,
  reviewComment: melody.reviewComment,
});

// What an admin sees, with the owner's and reviewer's names filled in by the caller
const toAdminMelody = (melody: any, users: Map<string, any>) => {
  const owner = users.get(melody.ownerId);
  const reviewer = melody.reviewedBy ? users.get(melody.reviewedBy) : undefined;
  const editor = melody.lastEditedBy ? users.get(melody.lastEditedBy) : undefined;
  return {
    ...toOwnerMelody(melody),
    ownerId: melody.ownerId,
    ownerName: owner?.name,
    ownerEmail: owner?.email,
    ownerPicture: owner?.picture,
    reviewedBy: melody.reviewedBy,
    reviewedByName: reviewer?.name,
    lastEditedBy: melody.lastEditedBy,
    lastEditedByName: editor?.name,
    catalogSongId: melody.catalogSongId,
  };
};

const loadUsers = async (ids: (string | undefined)[]) => {
  const validIds = Array.from(new Set(ids.filter((id): id is string => !!id && mongoose.Types.ObjectId.isValid(id))));
  const users = validIds.length ? await UserModel.find({ _id: { $in: validIds } }).select("name email picture") : [];
  return new Map(users.map((user: any) => [user._id.toString(), user]));
};

const usersOf = (melody: any) => [melody.ownerId, melody.reviewedBy, melody.lastEditedBy];

const getUserMelodies = async (ownerId: string) => {
  await setupMongooseConnection();
  const melodies = await UserMelodyModel.find({ ownerId }).sort({ createdAt: -1 });
  return melodies.map(toOwnerMelody);
};

const getMelodyById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const melody = await UserMelodyModel.findById(id);
  return melody ? toPublicMelody(melody) : null;
};

const countUserMelodies = async (ownerId: string) => {
  await setupMongooseConnection();
  return UserMelodyModel.countDocuments({ ownerId });
};

// What a melody holds besides its owner: either ABC text or piano-roll notes
export type MelodyContent =
  | { title: string; format: "abc"; abc: string }
  | { title: string; format: "roll"; roll: IMelodyRoll };

const toFields = (content: MelodyContent): { title: string; format: MelodyFormat; abc?: string; roll?: IMelodyRoll } =>
  content.format === "roll"
    ? { title: content.title, format: "roll", roll: content.roll }
    : { title: content.title, format: "abc", abc: content.abc };

// Field of the other format, removed on update so a melody never holds both
const otherFormatField = (content: MelodyContent) => (content.format === "roll" ? "abc" : "roll");

const addMelody = async (ownerId: string, content: MelodyContent) => {
  await setupMongooseConnection();
  const melody = await UserMelodyModel.create({
    ownerId,
    ...toFields(content),
    reviewStatus: "draft",
    lastEditedBy: ownerId,
  });
  return toOwnerMelody(melody);
};

// Returns null when the melody doesn't exist or belongs to someone else.
// A pending melody stays pending (the admin reviews the latest version); an
// approved or rejected one goes back to draft, so it can't change unseen.
const updateMelody = async (ownerId: string, id: string, content: MelodyContent) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const existing = await UserMelodyModel.findOne({ _id: new mongoose.Types.ObjectId(id), ownerId });
  if (!existing) {
    return null;
  }
  const status = statusOf(existing);
  const melody = await UserMelodyModel.findOneAndUpdate(
    { _id: existing._id, ownerId },
    {
      $set: {
        ...toFields(content),
        lastEditedBy: ownerId,
        reviewStatus: status === "approved" || status === "rejected" ? "draft" : status,
      },
      $unset: { [otherFormatField(content)]: 1 },
    },
    { new: true }
  );
  return melody ? toOwnerMelody(melody) : null;
};

// Owner sends a draft or rejected melody for review. Returns null when it isn't theirs or can't be sent.
const submitMelody = async (ownerId: string, id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const melody = await UserMelodyModel.findOneAndUpdate(
    // null also matches melodies saved before reviews existed
    { _id: new mongoose.Types.ObjectId(id), ownerId, reviewStatus: { $in: ["draft", "rejected", null] } },
    {
      $set: { reviewStatus: "pending", submittedAt: new Date() },
      $unset: { reviewedBy: 1, reviewedAt: 1, reviewComment: 1 },
    },
    { new: true }
  );
  return melody ? toOwnerMelody(melody) : null;
};

// Owner takes a pending melody back to draft
const withdrawMelody = async (ownerId: string, id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const melody = await UserMelodyModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), ownerId, reviewStatus: "pending" },
    { $set: { reviewStatus: "draft" } },
    { new: true }
  );
  return melody ? toOwnerMelody(melody) : null;
};

// ---- Admin ----

const ADMIN_PAGE_SIZE = 50;

// Melodies with one review status. Pending: the oldest submitted first, so the
// queue is fair. Others: the latest reviewed first.
const getMelodiesByStatus = async (status: ReviewStatus, page: number) => {
  await setupMongooseConnection();
  const sort: Record<string, 1 | -1> =
    status === "pending" ? { submittedAt: 1 } : status === "draft" ? { updatedAt: -1 } : { reviewedAt: -1 };
  const filter = { reviewStatus: status };
  const [melodies, total] = await Promise.all([
    UserMelodyModel.find(filter)
      .sort(sort)
      .skip(page * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE),
    UserMelodyModel.countDocuments(filter),
  ]);
  const users = await loadUsers(melodies.flatMap(usersOf));
  return { melodies: melodies.map((melody) => toAdminMelody(melody, users)), total, pageSize: ADMIN_PAGE_SIZE };
};

const countByStatus = async () => {
  await setupMongooseConnection();
  const rows = await UserMelodyModel.aggregate([
    { $match: { reviewStatus: { $in: ["pending", "approved", "rejected"] } } },
    { $group: { _id: "$reviewStatus", count: { $sum: 1 } } },
  ]);
  const counts = { pending: 0, approved: 0, rejected: 0 };
  rows.forEach((row: any) => {
    counts[row._id as keyof typeof counts] = row.count;
  });
  return counts;
};

const getRawMelody = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  return UserMelodyModel.findById(id);
};

const getAdminMelody = async (id: string) => {
  const melody = await getRawMelody(id);
  if (!melody) {
    return null;
  }
  return toAdminMelody(melody, await loadUsers(usersOf(melody)));
};

// Admin edits any melody; its review status doesn't change
const adminUpdateMelody = async (adminId: string, id: string, content: MelodyContent) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  await setupMongooseConnection();
  const melody = await UserMelodyModel.findByIdAndUpdate(
    id,
    { $set: { ...toFields(content), lastEditedBy: adminId }, $unset: { [otherFormatField(content)]: 1 } },
    { new: true }
  );
  return melody ? toAdminMelody(melody, await loadUsers(usersOf(melody))) : null;
};

const setReview = async (
  id: string,
  review: { status: "approved" | "rejected"; adminId: string; comment?: string; catalogSongId?: string | null }
) => {
  await setupMongooseConnection();
  const $set: Record<string, unknown> = {
    reviewStatus: review.status,
    reviewedBy: review.adminId,
    reviewedAt: new Date(),
  };
  const $unset: Record<string, 1> = {};
  if (review.comment) {
    $set.reviewComment = review.comment;
  } else {
    $unset.reviewComment = 1;
  }
  if (review.catalogSongId) {
    $set.catalogSongId = review.catalogSongId;
  } else if (review.catalogSongId === null) {
    $unset.catalogSongId = 1;
  }
  const melody = await UserMelodyModel.findByIdAndUpdate(id, { $set, $unset }, { new: true });
  return melody ? toAdminMelody(melody, await loadUsers(usersOf(melody))) : null;
};

const removeMelody = async (ownerId: string, id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  await setupMongooseConnection();
  const result = await UserMelodyModel.deleteOne({ _id: new mongoose.Types.ObjectId(id), ownerId });
  return result.deletedCount > 0;
};

export const userMelodiesApi = {
  getUserMelodies,
  getMelodyById,
  countUserMelodies,
  addMelody,
  updateMelody,
  removeMelody,
  submitMelody,
  withdrawMelody,
  getMelodiesByStatus,
  countByStatus,
  getRawMelody,
  getAdminMelody,
  adminUpdateMelody,
  setReview,
};
