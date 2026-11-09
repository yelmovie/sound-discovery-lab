# Concept explanation polish - 2026-11-09

## Changes
Five concept clips: four synchronized transcript cues, contextual terms and a one-sentence summary. Wide tablets show the movie and explanation side by side. Pitch title clarified to refer to the shorter ruler and faster vibration.

- No changes to rewards, progress storage, learning judgments, maps or audio logic.
- No new generated bitmap or replacement movie. Existing imagery inspected and reused.
- No endless decorative motion; short transitions and reduced-motion support.

## Verification
- Mac arm64, Node v24.22.2. 92 project tests passed, build passed. Final log: /tmp/explainer-final-11.log.
- Isolated Chrome profile at 1024x768, 873x580 and 1920x1080. No page errors or document horizontal overflow.
- Representative screenshots: output/concept-explainer-20261109/.
- Reduced motion prevents autoplay. Manual playback time advances. Error-event fallback retains explanatory text/images and terms. Scene seeking directly checked in projects 8-10.

## Limits
Representative concept screens were checked at all three sizes, not every clip in full. Physical tablet/whiteboard and human audio listening were not tested. Deployment is separately coordinated by the series release owner.
