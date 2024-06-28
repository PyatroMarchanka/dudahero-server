const whitelist = ["http://localhost:3000", "https://dudahero.org"];

export const corsOptions = {
  origin: function (origin: any, callback: any) {
    console.log('origin', origin)
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
