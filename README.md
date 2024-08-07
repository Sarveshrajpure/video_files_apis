# Nodejs Video Editor Server

Apis in nodejs to manipulate video files

## Run Locally

Clone the project

```bash
  git clone https://github.com/Sarveshrajpure/video_files_apis
```

Go to the project directory

```bash
  cd video_files_apis
```

Install dependencies

```bash
  npm install
```

Create Environment file

- Create a new file by the name .env in the root folder and add all the environment variables from the .env.example file which is available in the root folder.

Start the server

```bash
  npm run dev
```

## Running Tests

To run tests, run the following command

```bash
  npm run test
```

## Tech Stack

**Server:**

- Nodejs - 20.10.0
- Express - ^4.19.2
- Sqlite3 - ^5.1.7
- Squelize - ^6.37.3

## Features

- User Register & Signin
- Video Upload
- Video Trimming
- Video Concatenate

## Acknowledgements

- [Sequelize Docs](https://sequelize.org/docs/v6/getting-started/)
- [Concatenate Videos with FFmpeg and Node.js](https://www.youtube.com/watch?v=Yx4D9IfBHks&t=1123s)
- [Jest Docs](https://jestjs.io/docs/getting-started)
