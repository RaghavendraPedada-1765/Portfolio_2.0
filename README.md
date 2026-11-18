# Raghavendra Pedada — Enter the Grand Line

My personal portfolio, built as a cinematic 3D voyage inspired by *One Piece*. Sail past the Thousand Sunny, meet the crew (each one mapped to a part of my skill set), explore my projects as Devil Fruits, read my Wanted poster, and ring the Den Den Mushi to get in touch.

**Live:** https://raghavendrapedada.dev
**Lite (text-first) version:** https://raghavendrapedada.dev/lite.html

## What's inside

| Scene | What you'll find |
| --- | --- |
| The Sunny | Intro and who I am |
| The Crew | Ten crewmates, each linked to the tools and skills I use |
| Expeditions | [HashPilot](https://github.com/RaghavendraPedada-1765/HashPilot), [Cosmic-RAG-System](https://github.com/RaghavendraPedada-1765/Cosmic-RAG-System), [AI ATS Checker](https://github.com/RaghavendraPedada-1765/AI_ATS_Check) |
| The Captain | About me, education and experience at IFB Automotive |
| Connect | Email, GitHub and LinkedIn |

## Tech stack

- **Three.js r168** for the scene: animated ocean shader, scripted camera path, GLTF/Draco model loading, bloom post-processing
- **Vanilla JavaScript, HTML and CSS**: no framework and no build step
- **Blender + Mixamo** to rig and animate some of the crew models, compressed with Draco

## Built with performance and accessibility in mind

- Models load on demand and are cached for the visit
- Smaller screens get a lower pixel ratio, and bloom is off by default; a "Lighter effects" toggle is always available
- Reduced-motion mode pauses animation and respects `prefers-reduced-motion`
- Details open in native `<dialog>` elements with keyboard and Escape support
- Audio stays off until you opt in
- A full text-based Lite version for anyone who prefers to skip the 3D

## Run it locally

No install needed. Serve the `dist/` folder over HTTP:

```bash
python -m http.server 5174 --directory dist
```

Then open http://localhost:5174.

## Deployment

Every push to `main` deploys `dist/` to GitHub Pages through `.github/workflows/deploy.yml`.

## Credits

*One Piece* and its characters belong to Eiichiro Oda, Shueisha and Toei Animation. This is a non-commercial fan tribute. The 3D crew, ship and harbor models are third-party fan creations; the Devil Fruit, portal and Den Den Mushi models were made for this site.

## Contact

raghavendrapedadaa@gmail.com · [LinkedIn](https://www.linkedin.com/in/raghavendra-pedada-baa349356/) · [GitHub](https://github.com/RaghavendraPedada-1765)
