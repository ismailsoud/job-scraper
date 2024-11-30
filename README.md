# Job Scraper

A powerful web scraping application that aggregates job listings from multiple freelance platforms including Upwork, Freelancer, and Mostaql. The scraper runs automatically every hour and provides the data through a REST API.

## Features

- Multi-platform job scraping (Upwork, Freelancer, Mostaql)
- Automated hourly scraping
- REST API endpoint for accessing scraped data
- Stealth mode scraping using puppeteer-extra
- Proxy support for avoiding rate limits
- Detailed error logging system
- CORS enabled for cross-origin requests

## Tech Stack

- Node.js
- Express.js
- Puppeteer
- Axios
- TailwindCSS

## Project Structure

```
job-scraper/
├── data/
│   ├── data.json         # Scraped job data
│   └── proxyList.json    # Proxy configuration
├── Logs/
│   ├── log.text          # Error logs
│   └── upworkHtmlLog.html# HTML logs for debugging
├── index.js              # Express server setup
├── scraper.js           # Core scraping logic
└── package.json
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the application:
```bash
npm start
```

This will:
- Start the Express server on port 3000
- Initialize the scraping process
- Run scraping every hour automatically

2. Access the scraped data:
- The scraped job data is available at: `http://localhost:3000/api/data`
- The data is automatically updated every hour

## API Endpoint

### GET /api/data
Returns all scraped job listings in JSON format. Each job listing contains:
- title: Job title
- description: Job description
- price: Job budget/rate
- time: Posting time
- link: Original job posting URL
- site: Source platform (upwork/freelancer/mostaql)

## Error Handling

The application includes comprehensive error logging:
- General errors are logged to `Logs/log.text`
- HTML content for debugging Upwork scraping issues is saved to `Logs/upworkHtmlLog.html`

## Dependencies

- express: ^4.18.2
- puppeteer: ^21.6.1
- puppeteer-extra: ^3.3.6
- puppeteer-extra-plugin-stealth: ^2.11.2
- puppeteer-extra-plugin-proxy: ^1.0.2
- proxy-chain: ^2.4.0
- axios: ^1.6.3
- cors: ^2.8.5
- date-fns: ^2.30.0

## License

ISC
