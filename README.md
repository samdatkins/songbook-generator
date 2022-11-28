# Run locally

- These docs assume you are on Mac OS with homebrew already installed
- Install node 18
  - `brew install node@18`
- Install yarn
  - `brew install yarn`
- Install postgres
  - `brew install postgres`
- Create a local postgres database and enter it's connection URL as an environment variable into `/.env` as `DATABASE_URL_DEVELOPMENT`
- Run `yarn install`
- Run `yarn start`
- In a different terminal, run `cd frontend && yarn start`
- Access the site at `http://localhost:3001`

# Current Work

- Backend
  - Replace Request with axios
  - Set `noImplicitAny` to true and fix all errors
  - Create types for all database tables
- Frontend
  - Create react frontend
