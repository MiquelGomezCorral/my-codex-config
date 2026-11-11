# Probe examples

Examples of what a planning probe covers and what it leaves out.

**Train a model on a million images**
- The probe has: a notebook that imports the library and builds the model with the right input and output and no real hidden layers; a short pipeline that turns images into the model's input; one pass to see some output.
- Outside: augmentation and full dataset work.

**A simple UI**
- No probe. Build it in slices: the logic first, then the UI around it.

**An app that calls an API**
- The probe calls every endpoint the feature will use.

**A model that keeps giving errors**
- The probe runs another model's known-good weights through your pipeline. Right answers mean the model is the problem; wrong ones mean the pipeline.
- Keep that first probe and rerun it when the processing changes.

**Fine-tune a speech-to-text model on our call recordings**
- Trying to: check that our recordings and transcripts fit the model before any training.
- The probe has: a notebook with a small free pretrained model; three of our recordings turned into model input by the shortest code that works; one pass where the pretrained model transcribes them (the audio path is right); the same pass with our transcripts as labels, which must give a real loss number (the labels match the tokenizer).
- In scope: audio format, label matching, memory for one batch on our GPU. Outside: cleaning the full dataset, augmentation, real training, accuracy, tuning.
- For example: Whisper tiny, audio at 16 kHz mono. The notebook stays in the repo's notebooks folder.

**Forecast daily sales from the shop's CSV export**
- Trying to: check the export can become training rows without leaking the future.
- The probe has: a notebook reading one month of the real export; a few feature rows (day of week, last week's sales) built by the shortest code that works; a check that each row's features come only from days before its target; a tiny model with default settings, fit on that month, only to see predictions with the right shape and dates.
- In scope: the file's real columns and quirks, date alignment, output shape. Outside: feature choice, tuning, backtesting, accuracy, dashboards.
- For example: LightGBM with defaults on one month of rows.

**Take payments with Stripe Checkout**
- Trying to: check the Stripe calls and the payment notice we'll rely on, before building pages.
- The probe has: a small script in test mode, with test keys the user gives; one checkout for one item, paid with Stripe's test card; the payment notice (webhook) received on this machine, with its signature checked; the amount and customer email read back from it.
- In scope: only the calls and events the feature will use. Outside: page design, emails, refunds, taxes, live keys.
- For example: Stripe CLI `stripe listen` forwards the webhook locally; test card 4242 4242 4242 4242; amounts in cents. Never live keys.

**Two people edit the same list at once**
- Trying to: check that edits made at the same moment merge, and that a dropped connection catches up.
- The probe has: the sync library we plan to use, with its server run on this machine; two small scripts acting as two users, editing the same item at the same moment; one script going offline, editing, and reconnecting; a check that both end with the same list.
- In scope: merging, reconnecting, the size of one edit's message. Outside: the UI, login, saving to the database, many users at once.
- For example: Yjs with `y-websocket`, two Node scripts.

**A map that shows 50,000 stores**
- Trying to: check the map library stays smooth with our real number of points.
- The probe has: a bare page with the map library and 50,000 fake points in our data format; the time to first draw and how smooth panning feels, on a normal laptop and in phone mode; the same with the library's grouping of nearby points turned on.
- In scope: the library choice, and whether grouping is needed. Outside: styling, filters, the real data API, popups.
- For example: MapLibre GL with clustering; fake GeoJSON points.
