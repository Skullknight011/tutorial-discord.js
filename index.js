const fs = require('fs');
const Discord = require('discord.js');
const  prefix = '!'
const keepAlive = require('./server.js'); // this is for the express webserver 


const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
const cooldowns = new Discord.Collection();

client.once('ready', async () => {


  client.user.setActivity(`with !play | ${client.guilds.cache.size} servers! `); 
	console.log('Ready!');
});
client.on("disconnected", function () {
    console.log("Disconnected from Discord");
    process.exit(1);
});
client.on('message', message => {
if (!message.content.toLowerCase().startsWith(prefix) || message.author.bot) return;

  
  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;




  if (command.guildOnly && message.channel.type !== 'text') {
    return message.reply('I can\'t execute that command inside DMs!');
  }

if(message.channel.guild && !message.guild.me.hasPermission(["VIEW_CHANNEL"])) return message.author.send("I do not have permision to send messages in your channel.ask a admin to give me permision > require > VIEW_CHANNEL")

if(message.channel.guild && !message.guild.me.hasPermission(["SEND_MESSAGES"])) return message.author.send("I do not have permision to send messages in your channel.ask a admin to give me permision > require > SEND_MESSAGES")


  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.channel.send(`ERROR >>: ${error}`);
  }
});
keepAlive(); //run the webserver

client.login(process.env.TOKEN);
