import _ from "lodash";

exports.up = async function(knex, Promise) {
  await knex.schema.createTable("song", t => {
    t.uuid("id")
      .notNullable()
      .unique()
      .primary();
    t.string("artist");
    t.string("title");
    t.string("url").unique();
    t.string("content", 50000);
  });

  const rows = await knex("song_entry").select(
    "id",
    "artist",
    "title",
    "url",
    "content",
  );

  const distinctRows = _.uniqBy(rows, "url");

  await knex("song").insert(distinctRows);

  await knex.schema.table("song_entry", t => {
    t.uuid("song_id");
    t.foreign("song_id")
      .references("id")
      .inTable("song");
  });

  const songs = await knex("song").select("id", "url");

  const song_entries = await knex("song_entry").select("id", "url");

  song_entries.map(async song_entry => {
    const song_id = songs.find(song => song.url === song_entry.url).id;
    const query = knex("song_entry")
      .where({ id: song_entry.id })
      .update({ song_id });
    await query;
  });

  await knex.schema.alterTable("song_entry", t => {
    t.uuid("song_id")
      .notNullable()
      .alter();
  });

  await knex.schema.table("song_entry", t => {
    t.dropColumn("artist");
    t.dropColumn("title");
    t.dropColumn("url");
    t.dropColumn("content");
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.table("song_entry", t => {
    t.dropForeign("song_id");
  });

  await knex.schema.table("song_entry", t => {
    t.string("artist");
    t.string("title");
    t.string("url");
    t.string("content", 50000);
  });

  // re-popuplate song_entry
  const songs = await knex("song").select(
    "id",
    "artist",
    "title",
    "url",
    "content",
  );

  songs.map(async song => {
    const { id, ...songWithoutId } = song;
    const query = knex("song_entry")
      .where({ song_id: song.id })
      .update({ ...songWithoutId });
    await query;
  });

  await knex.schema.table("song_entry", t => {
    t.dropColumn("song_id");
  });

  await knex.schema.dropTable("song");
};
