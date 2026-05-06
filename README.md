# Zwei Agent

AI agent for your Obsidian vault. Chat with your notes, use tools to search, read, and modify files — all powered by LLMs.

## Features

- AI chat interface inside Obsidian
- Support for multiple LLM providers (OpenAI, DeepSeek, Anthropic, Gemini, Perplexity, OpenRouter, xAI, Mistral, Kimi, Z.ai, MiniMax)
- Tool system: read files, search vault, run diffs, fetch URLs, YouTube transcripts, and more
- Customizable system prompts and saved prompt templates
- Token usage tracking and pricing information
- Dark mode support

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings → Community Plugins
2. Disable Safe Mode
3. Click Browse and search for "Zwei Agent"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from [Releases](https://github.com/FoundLegacy/zwei-agent-obsidian/releases)
2. Extract into your vault's `.obsidian/plugins/zwei-agent-obsidian/` folder
3. Enable the plugin in Obsidian Settings → Community Plugins

## Configuration

1. Open Settings → Zwei Agent
2. Go to the **Models & Providers** tab
3. Add your API keys for the providers you want to use
4. Configure your chat models

## Development

```bash
# Install dependencies
npm install

# Start dev mode with hot reload
npm run dev

# Production build
npm run build
```

## Support

If you find Zwei Agent useful, consider supporting development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/foundlegacy)

## License

MIT © [FoundLegacy](https://github.com/FoundLegacy)
