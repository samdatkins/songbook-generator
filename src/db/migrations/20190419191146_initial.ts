import { v4 as uuid } from "uuid";

exports.up = async function(knex, Promise) {
  await knex.schema.createTable("songbook", table => {
    table
      .uuid("id")
      .notNullable()
      .unique()
      .primary();
    table.timestamp("created_at").notNullable();
    table.string("session_key").notNullable();
    table.unique("session_key");
    table.timestamp("current_song_timestamp").notNullable();
  });

  await knex.schema.createTable("song_entry", table => {
    table
      .uuid("id")
      .notNullable()
      .unique()
      .primary();
    table.uuid("songbook_id").notNullable();
    table
      .foreign("songbook_id")
      .references("id")
      .inTable("songbook");
    table.string("artist");
    table.string("title");
    table.string("url");
    table.string("content", 50000);
    table.timestamp("created_at").notNullable();
    table.timestamp("removed_at");
  });

  const songbookId1 = uuid();
  await knex("songbook").insert([
    {
      id: songbookId1,
      session_key: "sams-test",
      created_at: new Date(),
      current_song_timestamp: new Date(),
    },
  ]);

  const songbookId2 = uuid();
  await knex("songbook").insert([
    {
      id: songbookId2,
      session_key: "sams-test2",
      created_at: new Date(),
      current_song_timestamp: new Date(),
    },
  ]);

  await knex("song_entry").insert([
    {
      id: uuid(),
      songbook_id: songbookId2,
      created_at: new Date(),
      artist: "Jeff Buckley",
      title: "Hallelujah",
      url:
        "https://tabs.ultimate-guitar.com/tab/jeff_buckley/hallelujah_chords_198052",
      content:
        "Capo 1 for the official video  https://www.youtube.com/watch?v=y8AWFf7EAc4\r\nNo capo for the original studio version  https://www.youtube.com/watch?v=WIF4_Sm-rgQ\r\n\r\n[Intro]\r\n[ch]C[/ch] [ch]Am[/ch] [ch]C[/ch] [ch]Am[/ch]\r\n\r\n[Verse 1]\r\n  [ch]C[/ch]                 [ch]Am[/ch]\r\nI heard there was a secret chord\r\n     [ch]C[/ch]                   [ch]Am[/ch]\r\nThat David played and it pleased the lord\r\n    [ch]F[/ch]                [ch]G[/ch]               [ch]C[/ch]        [ch]G[/ch]\r\nBut you don't really care for music, do you?\r\n        [ch]C[/ch]                  [ch]F[/ch]           [ch]G[/ch]\r\nWell it goes like this the fourth, the fifth\r\n    [ch]Am[/ch]                 [ch]F[/ch]\r\nThe minor fall and the major lift\r\n    [ch]G[/ch]            [ch]E7[/ch]             [ch]Am[/ch]\r\nThe baffled king composing hallelujah\r\n\r\n[Chorus]\r\n     [ch]F[/ch]           [ch]Am[/ch]          [ch]F[/ch]           [ch]C[/ch]    [ch]G[/ch]   [ch]C[/ch]      [ch]G[/ch]\r\nHallelujah, hallelujah, hallelujah, hallelu-u-u-u-jah ....\r\n\r\n[Verse 2]\r\n          [ch]C[/ch]                        [ch]Am[/ch]\r\nWell your faith was strong but you needed proof\r\n    [ch]C[/ch]               [ch]Am[/ch]\r\nYou saw her bathing on the roof\r\n    [ch]F[/ch]              [ch]G[/ch]             [ch]C[/ch]            [ch]G[/ch]\r\nHer beauty and the moonlight overthrew you\r\n[ch]C[/ch]                   [ch]F[/ch]       [ch]G[/ch]\r\nShe tied you to her kitchen chair\r\n    [ch]Am[/ch]                        [ch]F[/ch]\r\nShe broke your throne and she cut your hair\r\n    [ch]G[/ch]                  [ch]E7[/ch]            [ch]Am[/ch]\r\nAnd from your lips she drew the hallelujah\r\n\r\n[Chorus]\r\n     [ch]F[/ch]           [ch]Am[/ch]          [ch]F[/ch]           [ch]C[/ch]    [ch]G[/ch]   [ch]C[/ch]      [ch]G[/ch]\r\nHallelujah, hallelujah, hallelujah, hallelu-u-u-u-jah ....\r\n\r\n[Verse 3]\r\n[ch]C[/ch]              [ch]Am[/ch]\r\nBaby I've been here before\r\n     [ch]C[/ch]                       [ch]Am[/ch]\r\nI've seen this room and I've walked this floor\r\n  [ch]F[/ch]             [ch]G[/ch]             [ch]C[/ch]          [ch]G[/ch]\r\nI used to live alone before I knew you\r\n[ch]C[/ch]                          [ch]F[/ch]      [ch]G[/ch]\r\nI've seen your flag on the marble arch\r\n    [ch]Am[/ch]                    [ch]F[/ch]\r\nBut love is not a victory march\r\n       [ch]G[/ch]               [ch]E7[/ch]          [ch]Am[/ch]\r\nIt's a cold and it's a broken hallelujah\r\n\r\n[Chorus]\r\n     [ch]F[/ch]           [ch]Am[/ch]          [ch]F[/ch]           [ch]C[/ch]    [ch]G[/ch]   [ch]C[/ch]      [ch]G[/ch]\r\nHallelujah, hallelujah, hallelujah, hallelu-u-u-u-jah ....\r\n\r\n[Verse 4]\r\n     [ch]C[/ch]                         [ch]Am[/ch]\r\nWell there was a time when you let me know\r\n       [ch]C[/ch]            [ch]Am[/ch]\r\nWhat's really going on below\r\n    [ch]F[/ch]             [ch]G[/ch]               [ch]C[/ch]        [ch]G[/ch]\r\nBut now you never show that to me do you\r\n      [ch]C[/ch]             [ch]F[/ch]        [ch]G[/ch]\r\nBut remember when I moved in you\r\n        [ch]Am[/ch]            [ch]F[/ch]\r\nAnd the holy dove was moving too\r\n    [ch]G[/ch]               [ch]E7[/ch]            [ch]Am[/ch]\r\nAnd every breath we drew was hallelujah\r\n\r\n[Chorus]\r\n     [ch]F[/ch]           [ch]Am[/ch]          [ch]F[/ch]           [ch]C[/ch]    [ch]G[/ch]   [ch]C[/ch]      [ch]G[/ch]\r\nHallelujah, hallelujah, hallelujah, hallelu-u-u-u-jah ....\r\n\r\n[Verse 5]\r\n      [ch]C[/ch]               [ch]Am[/ch]\r\nWell, maybe there's a god above\r\n    [ch]C[/ch]             [ch]Am[/ch]\r\nBut all I've ever learned from love\r\n    [ch]F[/ch]                [ch]G[/ch]           [ch]C[/ch]          [ch]G[/ch]\r\nWas how to shoot somebody who outdrew you\r\n     [ch]C[/ch]                  [ch]F[/ch]       [ch]G[/ch]\r\nIt's not a cry that you hear at night\r\n     [ch]Am[/ch]                 [ch]F[/ch]\r\nIt's not somebody who's seen the light\r\n       [ch]G[/ch]               [ch]E7[/ch]          [ch]Am[/ch]\r\nIt's a cold and it's a broken hallelujah\r\n\r\n[Outro]\r\n     [ch]F[/ch]           [ch]Am[/ch]          [ch]F[/ch]           [ch]C[/ch]    [ch]G[/ch]   [ch]C[/ch]      [ch]G[/ch]\r\nHallelujah, hallelujah, hallelujah, hallelu-u-u-u-jah ",
    },
  ]);

  var laterDate = new Date();
  laterDate.setSeconds(laterDate.getSeconds() + 1);
  await knex("song_entry").insert([
    {
      id: uuid(),
      songbook_id: songbookId1,
      created_at: new Date(),
      artist: "Def Leppard",
      title: "Sugar",
      url:
        "https://tabs.ultimate-guitar.com/tab/def_leppard/pour_some_sugar_on_me_chords_1506911",
      content:
        "[Verse 1]\r\n[ch]C#m[/ch]\r\nLove is like a bomb, baby, c'mon get it on\r\nLivin' like a lover with a radar phone\r\nLookin' like a tramp, like a video vamp\r\nDemolition woman, can I be your man?\r\n\r\nRazzle 'n' a dazzle 'n' a flash a little light\r\nTelevision lover, baby, go all night\r\nSometime, anytime, sugar me sweet\r\nLittle miss ah innocent sugar me, yeah\r\n\r\n[Pre-Chorus]\r\nHey!\r\n      [ch]F#[/ch]        [ch]B[/ch]      [ch]F#[/ch]          [ch]B[/ch]\r\nC'mon,   take a bottle,   shake it up\r\n[ch]E[/ch]            [ch]A[/ch]       [ch]E[/ch]          [ch]B[/ch]\r\n   Break the bubble,   break it up\r\n\r\n[Chorus]\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, ooh, in the name of love\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, c'mon, fire me up\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour your sugar on me, oh, I can't get enough\r\n[ch]C#m[/ch]\r\nI'm hot, sticky sweet, from my head to my feet, yeah\r\n\r\n[Verse 2]\r\n[ch]C#m[/ch]\r\nListen! red light, yellow light, green-a-light go!\r\nCrazy little woman in a one man show\r\nMirror queen, mannequin, rhythm of love\r\nSweet dream, saccharine, loosen up\r\n\r\n[ch]C#m[/ch]\r\nYou gotta squeeze a little, squeeze a little\r\nTease a little more\r\nEasy operator come a knockin' on my door\r\nSometime, anytime, sugar me sweet\r\nLittle miss innocent sugar me, yeah, yeah\r\n\r\nGive a little more\r\n\r\n[Pre-Chorus]\r\n[ch]F#[/ch]        [ch]B[/ch]      [ch]F#[/ch]          [ch]B[/ch]\r\n   Take a bottle,   shake it up\r\n[ch]E[/ch]            [ch]A[/ch]       [ch]E[/ch]          [ch]B[/ch]\r\n   Break the bubble,   break it up\r\n\r\n[Chorus]\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, ooh, in the name of love\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, c'mon, fire me up\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour your sugar on me, oh, I can't get enough\r\n[ch]C#m[/ch]\r\nI'm hot, sticky sweet, from my head to my feet, yeah\r\n\r\n[Guitar solo] \r\n[ch]D[/ch]  [ch]E[/ch]  [ch]D[/ch]  [ch]E[/ch] \r\n\r\n[Bridge] [Drums Only]\r\nYou got the peaches, I got the cream\r\nSweet to taste, saccharine\r\n'cause I'm hot, say what, sticky sweet\r\nFrom my head, my head, to my feet\r\n\r\n[ch]E[/ch]\r\nDo you take sugar? one lump or two?\r\n\r\n[Pre-Chorus]\r\n[ch]F#[/ch]        [ch]B[/ch]      [ch]F#[/ch]          [ch]B[/ch]\r\n   Take a bottle,   shake it up\r\n[ch]E[/ch]            [ch]A[/ch]       [ch]E[/ch]          [ch]B[/ch]\r\n   Break the bubble,   break it up\r\n\r\n[Chorus]\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, ooh, in the name of love\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, c'mon, fire me up\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour your sugar on me oh, I can't get enough\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, ooh, in the name of love\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, (adlib)...\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, (adlib)...\r\n[ch]E[/ch]         [ch]A[/ch]        [ch]B[/ch]\r\nPour some sugar on me, yeah! Sugar me!",
    },
    {
      id: uuid(),
      songbook_id: songbookId1,
      created_at: laterDate,
      artist: "Harvey Danger",
      title: "Flagpole Sitta",
      url:
        "https://tabs.ultimate-guitar.com/tab/harvey_danger/flagpole_sitta_chords_41929",
      content:
        "This song sounds best if played on an acoustic since the chords cover most of\r\nthe bass and such. Looked all up and down but all I could find on this song was\r\ncrap if I found anything at all.. So, me and a few friends sat down and this is\r\nwhat we came up with.. enjoy.\r\n\r\n\r\n   [ch]D/A[/ch]   [ch]Am[/ch]   [ch]C[/ch]   [ch]C/B[/ch]  [ch]C/A[/ch]  [ch]Cadd4[/ch]  [ch]A[/ch]   [ch]F/C[/ch]  [ch]D2/F#[/ch]  [ch]D9/F#[/ch]\r\ne|--2----0----0----0----0-----0----0----1-----0------0----|\r\nB|--3----1----1----1----1-----1----2----1-----3------1----|\r\nG|--2----2----0----0----0-----0----2----2-----2------2----|\r\nD|--0----2----2----0----2-----3----2----3-----0------0----|\r\nA|--0----0----3----2----0-----3----0----3-----0------0----|\r\nE|--x----x----x----x----x-----x----x----x-----2------2----|\r\n\r\n\r\n[Intro] (Make sure to mute the 4th string, I drone the E string)\r\n   [ch]D[/ch]   [ch]E[/ch]   [ch]F#[/ch]   [ch]A[/ch]   [ch]G[/ch]   [ch]F#[/ch]   [ch]E[/ch]   [ch]D[/ch]   [ch]C[/ch]   [ch]E[/ch]   [ch]C[/ch]   [ch]E[/ch]   [ch]D[/ch]\r\ne|--------------------------------------------------------|\r\nB|--------------------------------------------------------|\r\nG|-7---9---11---14--12--11---9---7---5---9---5---9---7----|\r\nD|--------------------------------------------------------|\r\nA|-5---7---9----12--10--9----7---5---3---7---3---7---5----|\r\nE|--------------------------------------------------------|\r\n\r\n\r\n[Verse 1]\r\n\r\n[ch]D/A[/ch]                                                  [ch]Am[/ch]\r\nI had visions, I was in them, I was looking into the mirror\r\n                    [ch]C[/ch]            [ch]C/B[/ch]                    [ch]D/A[/ch]\r\nto see a little bit clearer, the rottenness and evil in me\r\n[ch]D/A[/ch]                                                            [ch]Am[/ch]\r\nFingertips have memories, mine can't forget the curves of your body\r\n                      [ch]C[/ch]          [ch]C/B[/ch]                        [ch]D/A[/ch]\r\nAnd when I feel a bit naughty, I run it up the flagpole and see\r\n\r\nwho salutes, but no one ever does\r\n\r\n\r\n[Chorus]\r\n\r\n[ch]D/A[/ch]                      [ch]C/A[/ch]              [ch]C[/ch]    [ch]Cadd4[/ch]        [ch]D/A[/ch]\r\nI'm not sick but I'm not well, and I'm so hot, cause I'm in hell\r\n\r\n\r\n[Verse 2]\r\n\r\n[ch]D/A[/ch]                                                [ch]Am[/ch]\r\nBeen around the world and found that only stupid people are breeding\r\n                    [ch]C[/ch]            [ch]C/B[/ch]                    [ch]D/A[/ch]\r\nThe cretins cloning and feeding, and I don't even own a TV\r\n[ch]D/A[/ch]                                                           [ch]Am[/ch]\r\nPut me in the hospital for nerves and then they had to commit me\r\n                      [ch]C[/ch]          [ch]C/B[/ch]                        [ch]D/A[/ch]\r\nYou told them all I was crazy, they cut off my legs now\r\n\r\nI'm an amputee, god damn you\r\n\r\n\r\n[Chorus]\r\n\r\n[ch]D/A[/ch]                      [ch]C/A[/ch]              [ch]C[/ch]    [ch]Cadd4[/ch]        [ch]D/A[/ch]\r\nI'm not sick but I'm not well, and I'm so hot, cause I'm in hell\r\n[ch]D/A[/ch]                      [ch]C/A[/ch]              [ch]C[/ch]    [ch]Cadd4[/ch]        [ch]D/A[/ch]\r\nI'm not sick but I'm not well, and it's a sin, to live so well\r\n\r\n\r\n[Bridge]\r\n\r\n[ch]A[/ch]                [ch]G[/ch]                       [ch]F/C[/ch]\r\nI wanna publish 'zines, and rage against machines\r\n        [ch]D2/F#[/ch]                                       [ch]A[/ch]\r\nI wanna pierce my tongue, it doesn't hurt, it feels fine\r\n            [ch]G[/ch]                             [ch]F/C[/ch]\r\nThe trivial sublime, I'd like to turn off time\r\n            [ch]D2/F#[/ch]  [ch]D9/F#[/ch]             [ch]D2/F#[/ch]  [ch]D9/F#[/ch]\r\nand kill my mind,        you kill my mind\r\n\r\n\r\n[Verse 3]\r\n\r\n[ch]D/A[/ch]                                                [ch]Am[/ch]\r\nParanoia, paranoia, everybody's comin' to get me\r\n                    [ch]C[/ch]            [ch]C/B[/ch]                    [ch]D/A[/ch]\r\nJust say you never met me, I'm going underground with the moles (to get holes)\r\n[ch]D/A[/ch]                                                            [ch]Am[/ch]\r\nHear the voices in my head, I swear to god it sounds like they're snoring\r\n                      [ch]C[/ch]          [ch]C/B[/ch]                        [ch]D/A[/ch]\r\nBut if you're bored then you're boring, the agony and the irony\r\n\r\nthey're killing me...woah\r\n\r\n\r\n[Chorus]\r\n\r\n[ch]D/A[/ch]                      [ch]C/A[/ch]              [ch]C[/ch]    [ch]Cadd4[/ch]        [ch]D/A[/ch]\r\nI'm not sick but I'm not well, and I'm so hot cause I'm in hell\r\n[ch]D/A[/ch]                      [ch]C/A[/ch]              [ch]C[/ch]    [ch]Cadd4[/ch]        [ch]D/A[/ch]\r\nI'm not sick but I'm not well, and it's a sin to live so well\r\n",
    },
  ]);
};

exports.down = async function(knex, Promise) {
  await knex.schema.dropTable("song_entry");
  await knex.schema.dropTable("songbook");
};
