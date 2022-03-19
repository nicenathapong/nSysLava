# **📘 nSysLava**
> Lavalink client with lots of extra functionality, easy to use and well optimized!

**พัฒนาโดยคนไทย 😳**
- **Many utility functions** - มีฟังก์ชันอรรถประโยชน์มากมาย
- **Lightweight and high efficiency** - เบาและมีประสิทธิภาพสูง

## **❤️ Interesting function / ฟังก์ชันที่น่าสนใจ**

- **Best Reconnecting handles**
- **Load Balance**
- **Queue System**
- **Autoplay**

## **📌 Links**
- [**Github**](https://github.com/nicenathapong/nSysLava)
- [**npm**](https://www.npmjs.com/package/nsyslava)

## **📖 Installation / วิธีการติดตั้ง**
required [**Node.js**](https://nodejs.org/en/) v16+
```shell
npm i nsyslava
```
## **📘 Usage / การใช้งาน**

### **Setup**
```ts
import { Client } from 'discord.js';
import { nSysManager } from 'nsyslava';

const client = new Client({ intents: [...] });

const manager = new nSysManager([
    {
        name: 'nLavalink',
        host: 'localhost',
        port: 2333,
        secure: false,
        authorization: 'loveu3000',
        clientName: 'nSysLava',
        reconnect: {
            retryAmout: 999,
            delay: 3000,
        },
        search: true,
        play: true,
    }
])

manager.on('sendGatewayPayload', (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
})

client.ws.on('VOICE_SERVER_UPDATE', upd => manager.handleVoiceUpdate(upd))
client.ws.on('VOICE_STATE_UPDATE', upd => manager.handleVoiceUpdate(upd))

client.once('ready', () => {
    console.log(`[Client] is Ready! | Login as ${client.user.tag}`)
    manager.connect(client.user.id)
})

client.login(...)
```

### **Playing music**
```ts
const result = await manager.loadTracks('https://youtu.be/G0iN4jhaKqw');

if (result.loadType === 'LOAD_FAILED' || result.loadType === 'NO_MATCHES') return;

const player = manager.createPlayer(guildId);
player.connect(channelId);

player.queue.add(result.tracks);
player.queue.start();
```

### **Functions**
```ts
// skip
player.queue.skip();

// previous
player.queue.toPrevious();

// remove
player.queue.remove(4);

// shuffle
player.queue.shuffle();

// loop
// 0 = none
// 1 = queue
// 2 = track
player.queue.setLoop(2);

// Autoplay
player.queue.setAutoplay(true);

// pause
player.setPause(true);

// volume
player.setVolume(100);

// seek
player.seek(37000);

// Destroy player
manager.destroy(guildId)

// Node stats
const node = manager.getNode('nLavalink');
console.log(node.stats)

// Add node
manager.addNode({ ...nodeConfig })
```