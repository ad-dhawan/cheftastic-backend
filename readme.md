<p align="center">
  <img src="./cheftastic_logo.png" alt="Cheftastic Logo" width="200" />
</p>

# Cheftastic Backend

Cheftastic is a full stack UGC based application which lets user post and explore recipes from all over the world.
### Features
- google open authentication
- firebase cloud messaging
- mongo db pagination
- google cloud image optimization
- tensor flow NSFW image recognition

---
## Requirements

For development, you will only need Node.js and a node global package, Yarn, installed in your environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

---

## Install

    $ git clone https://github.com/ad-dhawan/cheftastic-backend.git
    $ cd cheftastic-backend
    $ npm install

## Configure app

Create and open `/.env` then edit it with your settings. You will need:

- DATABASE_URL
- FIREBASE_TYPE
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- FIREBASE_CLIENT_ID
- FIREBASE_AUTH_URI
- FIREBASE_TOKEN_URI
- FIREBASE_AUTH_PROVIDER
- FIREBASE_CLIENT_CERT
- GCLOUD_STORAGE_BUCKET

You can get these from your respective firebase, google cloud and mongo DB console

## Running the project

    $ npm start

## Deploy the project to cloud

    $ gcloud app deploy