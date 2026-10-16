# Colorful UI Design

A colorful React app made in Figma Make.

## Run it

You'll need [Node.js](https://nodejs.org) installed.

Clone the repo and open it:

```bash
git clone https://github.com/dstokes0523/colorful-ui-design.git
cd colorful-ui-design
```

Then, from the repo root, start it:

```bash
cd config
npm install
npm run dev
```

Open the URL it prints (usually **http://localhost:5173**) in your browser.

Press `Ctrl + C` in the terminal to stop.

## Already have the project? Get the latest first

If you cloned this before, pull the newest changes before running, so you're not
on an old version. From the repo root, copy and paste:

```bash
git pull
cd config
npm install
npm run dev
```

`npm install` only does anything when dependencies changed — it's safe to run every time.

## Folders

- **`src/`** — the app itself, from Figma Make.
- **`config/`** — the files added to make it build and run (you don't need to touch these).

## Other commands

Run these from the `config` folder too:

```bash
npm run build     # production build (output goes to dist/)
npm run preview   # preview the production build
```
