# Musical Akinator (web)

Made by [@dkaraush](https://dkaraush.me) with React, special for [int20h](https://int20h.best-kyiv.org/) hackathon.

Now it should be hosted at [https://muz.dkaraush.me/](https://muz.dkaraush.me/), using GitHub Pages.
(Doesn't work due to expired token :/. It should be paid, but I don't really want to.)

## Theory

Basically, this website can be built and run in two versions:
- `backend`: all requests are sent to [main backend server](https://github.com/thejunglegiant/backend-musical-akinator), written by [Oleksii Morozov](https://t.me/thejunglegiant). So, you should firstly run that server on heroku.
- `direct`: all API requests are sent directly to public APIs. You shouldn't run any backend server, but all your API tokens will be public, so be careful. All backend responses are simulated (score).

This app uses these APIs:
- [audd.io](https://audd.io) for recognizing and searching tracks (personal api_token needed)
- [Genius API](https://docs.genius.com/) for obtaining track's info (personal api_token needed)
- [Deezer API](https://developers.deezer.com/api) also for obtaining info about tracks (no api_token)

## Practice

### To build

1. Clone repo.
2. Run `npm install`.
3. Put your credentials and version of website in `credentials.sh`.
4. Run `./credentials.sh`.
5. Make `npm run build`.
6. Website is in `build/` folder.

### To deploy (GitHub Pages)

1. Make a fork of this repo and clone it.
2. Run `npm install`.
3. Put your credentials and version of website in `credentials.sh`.
4. Run `./credentials.sh`.
5. Run `npm run deploy`.
6. Configure GitHub settings of your repo to host.
