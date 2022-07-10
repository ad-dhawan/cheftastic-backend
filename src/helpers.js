const util = require('util')
const {Storage} = require('@google-cloud/storage')
const path = require("path")
const dotenv = require("dotenv");

//GOOGLE CLOUD STORAGE
const storage = new Storage({
    keyFilename: path.join(__dirname, "./cheftastic-2-df4d188bcb59.json"),
    projectId: "cheftastic-2"
});

dotenv.config()
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

const { format } = util

const uploadImage = (file) => new Promise((resolve, reject) => {
  const { originalname, buffer } = file

  const blob = bucket.file(originalname.replace(/ /g, "_"))
  const blobStream = blob.createWriteStream({
    resumable: false
  })

  blobStream.on('finish', () => {
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    )
    resolve(publicUrl)
  })
  .on('error', () => {
    reject(`Unable to upload image, something went wrong`)
  })
  .end(buffer)

})

module.exports = uploadImage