# Claude Code: Redesign Meeting Notes System

Read what we did on our memory.md yesterday in the docs folder- we worked on creating the notes system on the main travel page where we see the maps etc. Then we refactored it to make it lighter for all different operations and modules, but the layout ended up being misconfigured. 

We want to create one big free canvas space, with title of the notes on top yellow being the name of the meeting we are at, with the day and time of the meeting. The notes taken show who wrote them and at what time it was last edited. Remove the buttons below (open camera, start recording and add chart) - all buttons should be on the toolbar and functional, now when I click nothing happens. 

Make it visualize like a hybrid free form from Apple Freeform if you have a pen and iPad, with some grid for text where we can with the mouse drag the text, place it in a different spot, and graphs that we add from the toolbar on the canvas appear as a vizual graph perhaps inside a box, with dragging on the grid and placing where you want it with alignment and snapping woth drag and drop for all elements, as well as resizing. 

Option to record the meetings while you also text, then the recording's transcript is mixed and matched with what the user note down, or if you take pictures of a slide show, it will sync with the recordings and create a good summary.

Add some templates for well-known note-taking methods for productivity like quadrant methods, Cornell notes, mind maps, Flowcharts, SWOT analysis, Meeting Minutes, Project Planning, etc. But mainly, we want the layout to be one big canvas, with a button to go full screen, no split screen for preview. I want the graphs to be added and seen visually, and add a button on the graph that opens up the modal to be able to edit the graph and include rows/columns for each type of graph.

Ability to add an image and drag and resize it. Maybe we can use the new barrel roll feature if the user has the newest iPads and Apple Pencils for some of the toolbar actions.

Have the option for real time collaboration, but also option for each user to take their own notes, and in the end, the AI will summarize all notes, with transcript and pictures or files added to the meeting and email in the end of the trip to all participants.

## Additional Ideas to Consider:

**Smart Features:**
- Voice commands while drawing (say "add text" and it creates a text box where you're pointing)
- Auto-save every few seconds with a little "saved" indicator
- Quick emoji reactions on any element (👍 ❤️ 🤔) for fast feedback
- Laser pointer mode for presentations - click and drag to highlight areas temporarily
- Time-based playback - scrub through the meeting timeline and see notes appear as they were created

**Organization & Search:**
- Tag system for notes (#action-item #important #follow-up) with color coding
- Search across all meeting notes with instant results
- Bookmark important moments during recording with one click
- Auto-detect action items and create a separate action items panel
- Link related notes across different meetings in the same trip

**Mobile & Accessibility:**
- Voice-to-text for people who can't write/draw
- One-handed mode for phone users
- Offline mode that syncs when connection returns
- Quick share - generate a public view-only link for stakeholders who weren't in the meeting

**Integration Ideas:**
- Connect with calendar to auto-populate meeting details
- Export to PowerPoint/Google Slides/PDF with one click
- Import PDFs and make them annotatable on the canvas
- Connect with company CRM to auto-tag relevant contacts
- Send action items directly to project management tools

Think of it like having a super-smart whiteboard that remembers everything and helps organize your thoughts automatically.

- **Canvas Manipulation**: Fabric.js for interactive canvas objects and transformations
- **Drawing & Sketching**: React Sketch Canvas or Excalidraw for freehand drawing
- **Chart Generation**: Chart.js or Recharts for embedded data visualizations
- **Voice Recording**: MediaRecorder API with react-media-recorder wrapper
- **Speech-to-Text**: Web Speech API or Deepgram for real-time transcription
- **File Upload**: React Dropzone for drag-and-drop file handling
- **Real-time Collaboration**: Supabase Realtime (already available) + Yjs for conflict resolution
- **Gesture Support**: Hammer.js for touch gestures (pinch, zoom, rotate)
- **Vector Graphics**: React SVG or Konva.js for scalable drawing elements
- **PDF Generation**: jsPDF or Puppeteer for meeting summary exports