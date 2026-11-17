# Junior Astronaut · Shackleton Outpost

A six-day lunar outpost game for ages 7–12, based on the 2026 Space Apps Junior Astronaut Mission Trainer brief. The browser opens the interactive 3D outpost at the root. The control room is available at `/#/outpost` and shares mission progress with the moonwalk. The LUNA-01 surface mission is available at `/#/briefing`.

## The 3D moonwalk

Choose **Start moonwalk** and follow the chapter beacon to a station. Use WASD or arrow keys to walk, drag the scene to look around, and press E to use a nearby station. Touch players can use the direction pad or tap a station to walk there. Turn on **Narration** for spoken chapter and station text where browser speech is available.

Complete the day's fieldwork to unlock the habitat terminal. Drag the oxygen collar, set the greenhouse lights, tilt the solar panels, move the crew into shelter, walk through three survey beacons, or align the antenna and send a test signal. The equipment has keyboard-accessible controls and the survey course offers an assisted walk. The order varies by mission seed.

Open **Data playback** to play, pause, or scrub through three visualizations. The radiation comparison uses measured Artemis I dose rates. The radio animation uses the NASA Artemis communications reference for the round-trip timing. The oxygen animation visualizes the two-person baseline from NASA's crew oxygen planning figures. Each panel includes its source and labels the visualization's assumptions.

### Walk-up lunar heritage

Amber beacons identify three interactive replicas. Reach a beacon to see the original NASA or LROC image, traceable mission totals and a replayable scan. The heritage log remembers discoveries between sessions. Each card gives the original lunar site. The replica locations are fictional.

- [Surveyor 3 image](https://science.nasa.gov/resource/view-of-surveyor-iii-in-its-crater/) and [NASA report](https://ntrs.nasa.gov/api/citations/19920002733/downloads/19920002733.pdf). An animated photo counter shows the 6,326 images transmitted.
- [Lunokhod 2 orbital image](https://lroc.im-ldi.com/images/699?language=english) and [LROC traverse record](https://lroc.im-ldi.com/featured_sites/lunokhod-2/zoomable-traverse). An odometer shows the 39 km figure from the traverse viewer.
- [Apollo 17 rover photograph](https://science.nasa.gov/resource/apollo-17-gene-cernan-in-lunar-roving-vehicle/) and [NASA mission details](https://www.nasa.gov/missions/apollo/apollo-17-mission-details/). Animated totals show 30.5 km driven and 110.4 kg of samples returned by the mission.

### Lunar and 3D asset provenance

- [LROC NAC DTM NAC_DTM_ESALL_SR12](https://data.lroc.im-ldi.com/lroc/view_rdr_product/NAC_DTM_ESALL_SR12). A 97 by 97 sample crop of the 2 m/pixel Shackleton rim GeoTIFF, at zero-based input column 1126 and row 2086. The local datum is 1730.530 m. Mesh detail, hardware placement, outside-edge extensions, and the fictional outpost were adapted for gameplay.
- [NASA Apollo Lunar Module](https://science.nasa.gov/3d-resources/apollo-lunar-module/). NASA/Michael D. Carbajal model used in the science lab demonstration. Geometry was simplified for real-time rendering.
- [NASA Astronaut](https://science.nasa.gov/3d-resources/astronaut/). DigitalSpace Corporation model used for the suit reference by the habitat. The controllable astronaut uses an articulated training model.
- The main renderer uses WebGL. A software perspective renderer preserves the interactive world on browsers without WebGL. The control-room view also provides access to the same mission simulation.

Run `node --test frontend/tests/*.test.mjs` to check resource behavior and route connectivity across all six stations.


Open **Rover live** to follow Scout 01. It patrols five stops on a repeating route, scans local terrain and sends a visible packet to the habitat. At each stop, the game interpolates elevation from its LROC terrain grid and uses central differences to estimate the local slope. If the grid is unavailable, the console identifies the fallback readings as simulated. The fictional rover and signal path are gameplay illustrations. The local, rule-based Scout Analyst recalculates its briefing as packets arrive and answers questions from the latest 30 packets without an external model or API key.

The **Guide** explains the controls and highlights the next task. **Show me the way** walks the player to the current station. Once a run ends, the recap shows the crew assignments, completed station tasks, discoveries, final supplies, and a five-question **Cadet Quiz** with feedback, a score, and a retry.

A four-page illustrated comic introduces the mission before the first Moonwalk. The pictures are fictional briefing illustrations, and the dialogue and controls are readable text.

On the survey day, Scout sends scans from Western Rise and Relay Approach based on the same archived LROC grid as the game world. The player compares the two local slopes, chooses a spot and walks through the corresponding three beacons. The survey route changes actual planned battery and oxygen use; the amounts are training rules. The mission recap records the choice and its costs.

**Ask Comet** opens Comet, a browser-local chat assistant that handles greetings and common questions in English and French. It retrieves curated records from NASA DONKI, NASA OSDR, the Artemis I radiation study, NASA technical reports, the LROC archive, and Apollo mission archives. Numeric responses show their units and source, and crew supply calculations use the NASA reference assumptions shown in the reply. Its small local library and explicit matching rules keep answers inspectable and avoid unsupported guesses. DONKI event cards are archived rather than live.

## Play Shackleton Outpost

Allocate power to the oxygen maker, water recycler, and greenhouse lights. Then assign two astronauts to work inside, survey outside, or use the storm shelter. The end-of-day forecast shows both the supply changes and the cost of your plan. Ask Mission Control for advice at a cost of one power unit and a 5.4-second round trip. Run the day when you're ready. The game remembers your plan and completed days in this browser.

Try surveying on Days 1 and 5, working inside on other clear days, and sheltering on Day 3. If you spend an extra unit on the radio before the shadow window, reduce greenhouse power by one unit on Day 4 and restore it on Day 5. This starter run can reach six days, two field reports and a harvest. New mission changes the sunlight sequence and solar event. A complete mission needs at least 60% crew readiness and both science and harvest objectives. The flight log records each choice and its consequences.

## NASA data in the game

The public challenge brief was provided by the user. The source page's separate Resources tab was unavailable when checked. The trainer uses the named NASA programs and additional primary references. The in-game NASA data view links each source and explains how it affects gameplay.

| Source | Input and use |
| --- | --- |
| [DONKI solar particle record](https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/SEP/30717/1), [alternate record](https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/SEP/30684/1) | The archived STEREO-A detections supply the identifier, timestamp and instrument for the third-day training alert. |
| [OSDR RadLab](https://visualization.osdr.nasa.gov/radlab/gui/overview/), [Artemis I published analysis](https://doi.org/10.1038/s41586-024-07927-7) | The ratio of 134 to 287 μGy/min measured during an inner-belt pass at two Orion locations adjusts the fictional shelter exposure points. |
| [OSDR-267](https://osdr.nasa.gov/bio/repo/data/studies/OSD-267) and [NASA plant growth](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/) | The NASA experiment determines the in-game crop variety. The greenhouse uses water and LED power. |
| [NASA BVAD](https://ntrs.nasa.gov/citations/20210024855) and [ISS 98% recovery milestone](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/) | Per-person oxygen, water and food reference values set crew consumption. The demonstrated ISS recovery benchmark sets the fraction recovered from input water. |
| [Artemis command latency](https://ntrs.nasa.gov/api/citations/20250003885/downloads/NASA%20TM20250003885.pdf) and [lunar south pole environment](https://www.nasa.gov/reference/moonbase-environment/) | The nominal command latency is doubled for a real 5.4-second UI delay. Polar lighting motivates a low-production turn. |

Crew readiness, sunlight sequence, power units, radiation points, harvest timing and yield are fictional game settings. The outpost view is concept art. The app uses archived data and has no runtime API-key requirement.

## Run and test

```bash
npm --prefix frontend ci
npm run build:demo
python -m http.server 4173 --bind 127.0.0.1 --directory dist
node --test frontend/tests/outpost.test.mjs
```

Open [the local simulator](http://127.0.0.1:4173/). Outpost gameplay runs in the browser. The project also includes a FastAPI runtime for the earlier LUNA-01 mode.

---

# LUNA-01 surface mission

**Explore space. Make decisions. Protect your astronaut. Discover humanity’s space heritage.**

LUNA-01 is a fictional six-hour lunar surface mission for the SpaceForAll hackathon project. In one session you plan the traverse, log an Apollo discovery, manage suit resources and simulated physiology, collect samples and make the return decision. The interface is in English. It is an independent educational simulation inspired by Apollo.

## Run the full stack

Use Python 3.12 and Node.js 22 or newer.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
npm --prefix frontend ci
npm --prefix frontend run build
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Windows PowerShell activation uses `.venv\Scripts\Activate.ps1`. Open [the application](http://127.0.0.1:8000) or [the interactive OpenAPI reference](http://127.0.0.1:8000/docs). For frontend editing, run Uvicorn in one terminal and `npm --prefix frontend run dev` in another. The Vite dev server forwards `/api` to `127.0.0.1:8000`. Set the optional environment variable `LUNA_API_URL` for a different backend.

With Docker and Compose installed, build and start both tiers together.

```bash
docker compose up --build
```

## Run or build the portable demonstration

The hosted build uses Pyodide in a Web Worker to run the same Python engine, catalogue, request dispatcher and assistant. Vite bundles the React interface and the build copies the Python runtime into the static distribution. The browser saves the latest mission in session storage so a refresh in the same tab can resume it. Everything needed for the core simulation loads from the site’s own origin. Following a documentary source link requires internet access.

```bash
npm --prefix frontend ci
npm run build:demo
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open [the portable demonstration](http://127.0.0.1:4173). The REST build lives in `frontend/dist` and the portable build lives in `dist`.

## Mission walkthrough

Allow around 15–20 minutes for the presentation, including time to discuss the trade-offs and compare outcomes. Choices advance the simulated clock. You can read archive entries and charts at your own pace.

| Time | What to demonstrate |
| --- | --- |
| 0–3 min | Open the briefing, compare initial suit oxygen and blood SpO₂, and begin the mission. |
| 3–6 min | Choose **Complete equipment check** and **Easy and longer route**. Explain the slower route’s lower oxygen and exertion costs. |
| 6–10 min | Open **Artifact detected**, view the rover’s history, and ask **What is the purpose of this artifact?** in the assistant. Return to the console and log the discovery. |
| 10–15 min | Discuss the fatigue alert. Choose **Rest in a safe area**, **Collect two samples**, and **Safer return route**. The debrief shows **Successful Mission**, **05:45**, and **100/100**. |
| 15–20 min | Replay with the difficult route. Choose **Return early** for **70/100** with full safety credit. To show the emergency branch, choose **Continue the mission**, observe the locked science choices, skip collection, and confirm the warned **Direct return route**. |

## Architecture

| Area | Responsibility |
| --- | --- |
| `backend/engine/mission_scenario.json` | Scenario text, choices, effects, resources and timing. |
| `backend/engine/simulation_engine.py` | Choice projection, transitions, objectives, reserve checks, session-state updates and scoring. |
| `backend/engine/health_monitor.py` | Fictional risk thresholds and deterministic recommendations evaluated at each mission action. |
| `backend/api/dispatch.py`, `backend/main.py` | Shared application requests and FastAPI REST/Pydantic integration. |
| `backend/services/`, `backend/data/` | In-memory session service, heritage catalogue and local retrieval over curated documentation. |
| `frontend/src/` | React Router navigation, shared mission view, responsive controls, Framer Motion transitions and Recharts telemetry. |
| `frontend/demo/`, `scripts/package_demo.py` | Portable demo transport and packaging against the same Python engine. |

FastAPI keeps sessions in one server process. A server restart resets those sessions. A revision guard rejects duplicate or stale decisions. Updates are synchronous with simulated actions, so the interface uses REST requests without a background timer or WebSocket. The frontend shows projected decision effects after clamping, plus explicit warnings when a return would exceed a reserve or risk limit.

The assistant is a keyword and phrase retrieval system with extractive answers from curated notes. It cites the source entries and acknowledges missing material. It requires zero keys or external AI services. The data and retrieval service can be extended with a vector or generative provider. The shipped version uses rule-based risk detection and does not train or run an ML model.

Scoring gives up to 50 points for safe return, 20 for an Apollo observation and 15 per sample. An early safe return earns full safety credit. The health thresholds and effects are fictional game rules. Educational simulation only — not a medical monitoring or diagnostic system.

## API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/scenario` | Mission profile and initial conditions |
| POST | `/api/missions` | Create mission at briefing |
| GET | `/api/missions/{id}` | Current mission snapshot |
| POST | `/api/missions/{id}/choice` | Apply `{"choice":"start","revision":0}` or a current option |
| GET | `/api/missions/{id}/health` | Current alert, measurements and history |
| GET | `/api/discovery` | Catalogue |
| GET | `/api/discovery/{id}` | Individual artifact |
| POST | `/api/assistant` | Retrieve an answer for `{"question":"What was ALSEP?","object_id":"H03"}` |

## Verification

```bash
python -m unittest discover -s backend/tests -v
npm --prefix frontend run build
npm run build:demo
```

Tests cover the three outcomes, resource and critical-state gates, projected effects, stale decisions, session isolation, request validation, telemetry and sourced answers. Browser verification covers briefing, finding the rover, asking the assistant, alerts, mission restoration after refresh and all three endings.

## Historical references and media

- [NASA Apollo 17 mission details](https://www.nasa.gov/missions/apollo/apollo-17-mission-details/)
- [NASA Apollo 17 mission summary](https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_17a_Summary.htm)
- [NASA guidebook to Taurus–Littrow](https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/EP-101-OCR.pdf)
- [NASA Lunar Roving Vehicle history](https://www.nasa.gov/history/50-years-ago-first-apollo-astronauts-to-drive-on-the-moon-took-final-cruise/)
- [NASA annotated Apollo 17 orbital image](https://science.nasa.gov/image-article/apod-2011-september-8-apollo-17-site-a-sharper-view/), credited to NASA / GSFC / Arizona State University / Lunar Reconnaissance Orbiter.

The editable mission map uses fictional waypoints on an illustrated backdrop. Heritage keeps the independently annotated historical image with the distinct rover, descent-stage and ALSEP locations. The landing art, mission terrain background and object illustrations were generated for this project.
