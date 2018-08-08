---
redirect_from:
  - /redirect
---

## CAUTION
The API Docs guarantees that the link will work without additional plaintext login credentials, but it doesn't guarantee that the link won't contain any sensitive information. Check the link before sending it to an untrusted place, and use it at your own risk.

## Introduction

GUpload is a google drive add-on for creating upload link where the generated link doesn't need login credentials to work. For example, you can generate a link on your own PC, and then use the link to upload on other machine without exposing your login credentials.

### Usage

After adding to Drive, you can create links from New Menu.

Then upload by a `PUT` request to the link. For example, uploading by `curl`:
```bash
curl -X PUT "$URL" --upload-file file.txt
```
You can use any tools you like to upload.

The file will show up after uploading is done.

> *Note*: Link expires after one week.
