#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { downloadYouTube, getVideoInfo } = require('../services/youtubeService');
const path = require('path');

yargs(hideBin(process.argv))
  .command(
    'download <url>',
    'Download a YouTube video',
    (yargs) => {
      return yargs
        .positional('url', {
          describe: 'YouTube URL',
          type: 'string',
        })
        .option('format', {
          alias: 'f',
          describe: 'Output format: mp3 or mp4',
          choices: ['mp3', 'mp4'],
          default: 'mp4',
        })
        .option('quality', {
          alias: 'q',
          describe: 'Quality: best, 720p, 480p, 360p, 144p',
          default: 'best',
        })
        .option('output', {
          alias: 'o',
          describe: 'Output directory',
          default: path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'YTRippx'),
        });
    },
    async (argv) => {
      try {
        console.log(`Downloading from: ${argv.url}`);
        const result = await downloadYouTube(argv.url, argv.format, argv.quality, argv.output);
        console.log('Download complete!');
        console.log(`Saved to: ${result.path}`);
      } catch (error) {
        console.error('Download failed:', error.message);
        process.exit(1);
      }
    }
  )
  .command(
    'info <url>',
    'Get video information',
    (yargs) => {
      return yargs.positional('url', {
        describe: 'YouTube URL',
        type: 'string',
      });
    },
    async (argv) => {
      try {
        const info = await getVideoInfo(argv.url);
        console.log(`Title: ${info.title}`);
        console.log(`Duration: ${info.duration} seconds`);
        console.log(`Uploader: ${info.uploader}`);
        console.log(`Available formats: ${info.formats.length}`);
      } catch (error) {
        console.error('Failed to get info:', error.message);
        process.exit(1);
      }
    }
  )
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .demandCommand()
  .strict()
  .argv;
