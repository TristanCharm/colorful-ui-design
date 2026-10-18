# Colorful UI Design

A colorful React painting app made in Figma Make — built so people with
disabilities can make art, including **painting with your eyes or head** using a
regular webcam.

## Paint with your eyes or head

For users who can't use a mouse, the brush can be controlled by the webcam:

1. Click **👁 WEBCAM** in the toolbar, then **Turn on webcam control** and allow
   the camera when your browser asks.
2. Pick a mode:
   - **Head** — aim by turning/tilting your head. More accurate and stable; no
     calibration needed.
   - **Eyes** — look where you want the brush to go. Click **Calibrate** first
     (look at each dot and hold still).
3. **To draw, hold still** on a spot for about a second — that puts the "pen"
   down. Hold still again to lift it. Adjust the hold time, sensitivity, and
   smoothing in the panel.

**Privacy:** all webcam processing happens on your own device using an in-browser
model. Video never leaves your computer and nothing is uploaded or recorded.

> The first `npm install` downloads the small on-device tracking model
> automatically. If webcam control says it can't load the model, run
> `npm run setup:mediapipe` in the `config` folder and reload.

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

## Already have the project? Get the latest first (TRISTAN)

If you cloned this before, pull the newest changes before running, so you're not
on an old version. From the repo root, copy and paste: 

```bash 
cd colorful-ui-design
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
