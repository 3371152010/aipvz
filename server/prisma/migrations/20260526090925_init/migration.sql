-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "coins" INTEGER NOT NULL DEFAULT 0,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "world" INTEGER NOT NULL,
    "level_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "config_json" TEXT NOT NULL,
    "unlock_cost" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "level_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "best_time" INTEGER,
    "plants_lost" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "level_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "level_progress_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_plants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "plant_id" INTEGER NOT NULL,
    "unlocked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_plants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price_coins" INTEGER NOT NULL DEFAULT 0,
    "price_gems" INTEGER NOT NULL DEFAULT 0,
    "effect_json" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "battle_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "won" BOOLEAN NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "plants_used" TEXT NOT NULL,
    "plants_lost" INTEGER NOT NULL DEFAULT 0,
    "duration_sec" INTEGER NOT NULL,
    "coins_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "battle_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "match_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "player1_id" TEXT NOT NULL,
    "player2_id" TEXT NOT NULL,
    "winner_id" TEXT,
    "p1_stats" TEXT NOT NULL,
    "p2_stats" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "match_records_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "match_records_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "levels_world_level_number_key" ON "levels"("world", "level_number");

-- CreateIndex
CREATE UNIQUE INDEX "level_progress_user_id_level_id_key" ON "level_progress"("user_id", "level_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_plants_user_id_plant_id_key" ON "user_plants"("user_id", "plant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_items_user_id_item_id_key" ON "user_items"("user_id", "item_id");

-- CreateIndex
CREATE INDEX "battle_history_user_id_created_at_idx" ON "battle_history"("user_id", "created_at");
