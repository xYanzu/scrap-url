const { Client, Intents } = require('discord.js-selfbot-v13');
const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');

function clearConsole() {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    exec('cls', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(stdout);
    });
  } else {

    console.clear();
  }
}

clearConsole();

const BANNER = `
   ▄████████             ▄▄▄▄███▄▄▄▄                ▄███████▄ 
  ███    ███           ▄██▀▀▀███▀▀▀██▄             ███    ███ 
  ███    █▀            ███   ███   ███             ███    ███ 
  ███                  ███   ███   ███             ███    ███ 
▀███████████           ███   ███   ███           ▀█████████▀  
         ███           ███   ███   ███             ███        
   ▄█    ███           ███   ███   ███             ███        
 ▄████████▀             ▀█   ███   █▀             ▄████▀      
                                                              

                          𝘽𝙮 𝙔𝙖𝙣𝙯𝙪
`;

console.log('\x1b[35m' + BANNER);

let token = '';
let guildId = '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function runBot() {
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\x1b[33m> - Please choose an option:');
  console.log('\x1b[32m1 [+] Start');
  console.log('\x1b[32m2 [+] Config');
  console.log('\x1b[31m3 [+] Exit');

  rl.question('', async (choice) => {
    if (choice === '1') {
      if (!token || !guildId) {
        console.log('\x1b[31mPlease configure token and guild ID first (choose option 2).');
        runBot();
      } else {
        await startBot();
      }
    } else if (choice === '2') {
      await configure();
    } else if (choice === '3') {
      await exitProgram();
    } else {
      console.log('\x1b[31mInvalid choice. Please select a valid option.');
      rl.close();
    }
  });
}

async function startBot() {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

  client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    const guild = client.guilds.cache.get(guildId);

    if (guild) {
      const fileStream = fs.createWriteStream('links.txt', { flags: 'w' });
      guild.channels.cache.each(async (channel) => {
        if (channel.isText()) {
          try {
            console.log(`Scraping links from channel: ${channel.name}`);
            const messages = await channel.messages.fetch({ limit: 100 }); 

            messages.forEach((message) => {
              const urls = message.content.match(/(https?:\/\/\S+)/g);
              if (urls) {
                urls.forEach(url => fileStream.write(`${channel.name} - ${url}\n`));
              }
            });
          } catch (error) {
            console.error(`Error scraping channel ${channel.name}: ${error.message}`);
          }
        }
      });

      fileStream.on('finish', () => {
        console.log('Scraping complete. Links have been saved to links.txt');
        client.destroy();
        rl.close(); 
      });
    } else {
      console.error(`Guild with ID ${guildId} not found.`);
      client.destroy();
      rl.close(); 
    }
  });

  client.login(token);
}

async function configure() {
  console.log(`Current configuration: Token=${token}, Guild ID=${guildId}`);
  
  token = await askQuestion('\x1b[33m> - Enter your token: ');
  guildId = await askQuestion('\x1b[33m> - Enter the ID of your server (guild): ');

  if (!token || !guildId) {
    console.log('\x1b[31mToken and Guild ID are required. Please configure again.');
    await configure();
  } else {
    console.log('\x1b[32mConfiguration saved. Starting ...');
    await startBot();
  }
  rl.close();
}

async function exitProgram() {
  console.log('\x1b[31mExiting program...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  rl.close();
  process.exit();
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

runBot();
