# Contributing to Enlive

Thanks for checking out Enlive — a hobby Live2D viewer + embodiment runtime. This is a personal project, but contributions, ideas, and bug reports are welcome.

## How to Contribute

### Report a Bug
Open an issue with:
- What you expected to happen
- What actually happened
- Model name and any relevant logs

### Suggest a Feature
Open an issue describing:
- What you're trying to do
- Why it doesn't work well today
- A sketch of how it could work

### Submit Code

1. **Fork** the repo
2. **Create a branch**: `git checkout -b feat/my-change`
3. **Make your changes**
4. **Test** — run `python enlive_server.py` and confirm the viewer loads
5. **Commit** with a clear message
6. **Push** and open a Pull Request

### Code Style
- Python: PEP 8, type hints preferred
- TypeScript/JS: no strict style — just keep it readable and consistent
- Server changes go in `enlive_server.py`
- Viewer changes go in `viewer/src/main.ts`

## Adding a New Model

1. Place the model folder under `viewer/public/models/<ModelName>/`
2. Make sure it has `*.model3.json`, `*.moc3`, and texture files
3. Add a config entry in `enlive_server.py` under `MODEL_CONFIGS`
4. Add a config entry in `viewer/src/main.ts` under `modelConfigs`

## Questions?

Open a discussion or reach out to the maintainer.
