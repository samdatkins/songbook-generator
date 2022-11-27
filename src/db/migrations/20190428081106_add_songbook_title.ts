exports.up = async function(knex, Promise) {
  // Just a little cleanup, this table should have already been this way
  await knex.schema.alterTable("song_entry", function(t) {
    t.string("artist")
      .notNullable()
      .alter();
    t.string("title")
      .notNullable()
      .alter();
    t.string("url")
      .notNullable()
      .alter();
    t.string("content", 20000)
      .notNullable()
      .alter();
    t.uuid("songbook_id")
      .notNullable()
      .alter();
  });

  await knex.schema.table("songbook", t => {
    t.string("title", 40);
  });

  await knex("songbook").update("title", "test title");

  await knex.schema.table("songbook", t => {
    t.string("title", 40)
      .notNullable()
      .alter();
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable("song_entry", function(t) {
    t.string("artist").alter();
    t.string("title").alter();
    t.string("url").alter();
    t.string("content").alter();
    t.uuid("songbook_id").alter();
  });

  return await knex.schema.table("songbook", t => {
    t.dropColumn("title");
  });
};
