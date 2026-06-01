# ─── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ──————
#                        ᗰIᗪᑎIGᕼT ᖴᗩᖇᗰEᖇ
# ─── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ───── ⋆⋅☆⋅⋆ ──————
#
# Updated features:
#   • Random grid each game (no two runs are the same!)
#   • Difficulty selection — Easy / Normal / Hard
#   • High score + streak tracking saved to a file
#   • Shareable result card printed at the end
#
# New imports:
#   random — to shuffle the grid
#   json   — to save/load scores between sessions
#   os     — to check whether the save file already exists

import random
import json
import os


# =============================================================================
# DIFFICULTY SETTINGS
# Each difficulty is a dictionary with all the numbers that change per mode.
# "streak_threshold" is how many flowers you need to plant to keep your streak.
# =============================================================================

DIFFICULTIES = {
    "1": {
        "label":            "Easy",
        "moon":             "🌕",
        "crops":            8,     # how many "x" squares are hidden in the grid
        "turns":            17,    # total attempts (equals number of empty "o" squares)
        "strikes":          3,     # how many crops you can bump before you're caught
        "streak_threshold": 13,    # minimum flowers to count as a "good run"
    },
    "2": {
        "label":            "Normal",
        "moon":             "🌙",
        "crops":            12,
        "turns":            13,
        "strikes":          3,
        "streak_threshold": 10,
    },
    "3": {
        "label":            "Hard",
        "moon":             "🌑",
        "crops":            16,
        "turns":            9,
        "strikes":          2,
        "streak_threshold": 7,
    },
}


# =============================================================================
# SAVE FILE HELPERS
# We store scores in a JSON file so they persist between sessions.
# JSON is just a text format that Python can read/write like a dictionary.
# =============================================================================

SAVE_FILE = "midnight_farmer_saves.json"


def load_saves():
    """Read the save file and return the data. Return empty dict if no file yet."""
    if os.path.exists(SAVE_FILE):
        with open(SAVE_FILE, "r") as f:
            return json.load(f)
    return {}


def save_saves(data):
    """Write the data dictionary to the save file."""
    with open(SAVE_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_stat(saves, diff_label, key, default):
    """Safely read one stat for a difficulty. Returns 'default' if not found yet."""
    return saves.get(diff_label, {}).get(key, default)


def set_stat(saves, diff_label, key, value):
    """Write one stat for a difficulty into the saves dictionary."""
    if diff_label not in saves:
        saves[diff_label] = {}
    saves[diff_label][key] = value


# =============================================================================
# GRID GENERATION
# Instead of a fixed grid, we build a random one each game.
# We put the right number of "x" crops and "o" empty spots into a flat list,
# shuffle it, then slice it into 5 rows of 5.
# =============================================================================

def generate_rival_grid(crop_count):
    """Return a randomly shuffled 5x5 grid with crop_count crops."""
    flat = ["x"] * crop_count + ["o"] * (25 - crop_count)
    random.shuffle(flat)                              # shuffle in place
    return [flat[i * 5 : (i + 1) * 5] for i in range(5)]  # slice into 5 rows


# =============================================================================
# DISPLAY HELPERS
# =============================================================================

def print_grid(grid):
    """Pretty-print a 5x5 grid with row/column labels."""
    print()
    print("    1 2 3 4 5")
    print("   ───────────")
    for i, row in enumerate(grid, 1):
        print(f"  {i}| {' '.join(row)}")
    print()


def build_share_card(player_grid, rival_grid, diff, planted, streak):
    """
    Build a shareable text result card using emoji.
    This mirrors the "Copy Result" button in the web version.

    Key:
      🌸 = flower you planted (success)
      🌽 = crop you bumped (strike)
      🌿 = crop that was hidden (you never found it)
      ⬛ = empty spot you never visited
    """
    rows = []
    for r in range(5):
        row_str = ""
        for c in range(5):
            val = player_grid[r][c]
            if val == "p":
                row_str += "🌸"
            elif val == "x":
                row_str += "🌽"
            elif rival_grid[r][c] == "x":
                row_str += "🌿"   # hidden crop you didn't find
            else:
                row_str += "⬛"   # empty spot you didn't visit
        rows.append(row_str)

    streak_line = f" | 🔥 {streak}-game streak" if streak > 0 else ""

    lines = [
        "ᗰIᗪᑎIGᕼT ᖴᗩᖇᗰEᖇ",
        f"{diff['moon']} {diff['label']} | {planted}/{diff['turns']} flowers{streak_line}",
        "",
        *rows,
        "",
        "🌸 planted  🌽 struck  🌿 hidden  ⬛ untouched",
    ]
    return "\n".join(lines)


# =============================================================================
# MAIN GAME FUNCTION
# =============================================================================

def play_game():
    print("\nᗰIᗪᑎIGᕼT ᖴᗩᖇᗰEᖇ\n")
    print("It's the dead of night.")
    print("You have snuck onto a rival farmer's land.")
    print("As the malicious gremlin you are, you decide to plant some invasive flowers!")
    print("The only problem?")
    print("YOU CAN'T SEE!\n")
    print("The field is a 5 x 5 grid. Some spots already have crops.")
    print("Guess the coordinates to secretly plant your sabotaging flowers.")
    print("=" * 60)

    # ── DIFFICULTY SELECTION ─────────────────────────────────────────
    # Load saves first so we can show the player their existing records.

    saves = load_saves()

    print("\nChoose your darkness:\n")
    for key, diff in DIFFICULTIES.items():
        hs          = get_stat(saves, diff["label"], "high_score", -1)
        streak      = get_stat(saves, diff["label"], "streak", 0)
        best_streak = get_stat(saves, diff["label"], "best_streak", 0)

        hs_str      = f"Best: {hs}/{diff['turns']}" if hs >= 0 else "Best: —"
        streak_str  = f"  🔥 Streak: {streak} (best: {best_streak})" if best_streak > 0 else ""

        print(f"  [{key}] {diff['moon']} {diff['label']:6}  "
              f"{diff['crops']} crops | {diff['turns']} turns | {diff['strikes']} strikes"
              f"    {hs_str}{streak_str}")

    while True:
        choice = input("\nEnter 1, 2 or 3: ").strip()
        if choice in DIFFICULTIES:
            diff = DIFFICULTIES[choice]
            break
        print("Please enter 1, 2 or 3.")

    print(f"\n{diff['moon']} {diff['label'].upper()} MODE — let's go!\n")

    # ── GRID SETUP ───────────────────────────────────────────────────
    # The rival grid is randomly generated — different every time!
    # The player grid starts full of "?" (unknown).

    rival_grid  = generate_rival_grid(diff["crops"])
    player_grid = [["?"] * 5 for _ in range(5)]

    max_turns   = diff["turns"]
    max_strikes = diff["strikes"]
    turns       = max_turns
    strikes     = 0
    planted     = 0
    end_reason  = "timeup"   # will be updated as the game plays out

    # ── GAME LOOP ────────────────────────────────────────────────────
    while turns > 0:
        hs     = get_stat(saves, diff["label"], "high_score", -1)
        streak = get_stat(saves, diff["label"], "streak", 0)
        hs_str = f"{hs}/{max_turns}" if hs >= 0 else "—"

        print(f"Attempts left: {turns}/{max_turns} | "
              f"Strikes: {strikes}/{max_strikes} | "
              f"Best: {hs_str} | "
              f"🔥 Streak: {streak}")
        print("Current Field Map:")
        print_grid(player_grid)

        try:
            guess_row    = int(input("Enter row (1, 2, 3, 4 or 5):    ")) - 1
            guess_column = int(input("Enter column (1, 2, 3, 4 or 5): ")) - 1
        except ValueError:
            print("\nOops! That's not a number. Try again.\n")
            continue

        if not (0 <= guess_row < 5 and 0 <= guess_column < 5):
            print("\nThose coordinates are outside the fence! Try again.\n")
            continue

        if player_grid[guess_row][guess_column] != "?":
            print("\nYou already checked this spot tonight!\n")
            continue

        if rival_grid[guess_row][guess_column] == "x":
            # Hit a crop — mark with "x" and add a strike
            print("\nOh no! There's already a plant here! Stubborn thing...\n")
            player_grid[guess_row][guess_column] = "x"
            strikes += 1

            if strikes >= max_strikes:
                print("UH OH! You made too much noise rummaging in the crops!")
                print("The rival Farmer turned on the porch lights! You gotta get outta there!")
                end_reason = "caught"
                break
        else:
            # Empty spot — plant a flower and mark with "p"
            print("\nSuccess! You secretly planted a sabotaging flower!\n")
            player_grid[guess_row][guess_column] = "p"
            planted += 1
            turns -= 1

            if planted == max_turns:
                end_reason = "perfect"
                break

    # ── GAME OVER ────────────────────────────────────────────────────
    print("\n=== GAME OVER ===")
    print("The Rival Farmer is waking up!")
    print("You sprint back to your own farm. Here is what you managed to plant:")
    print_grid(player_grid)

    print(f"Score: You sneaked {planted}/{max_turns} sabotaging flowers onto the Rival's farm!")

    if end_reason == "perfect":
        print("\nA perfect, chaotic victory!")
        print("Through some sorcery, you manage to perfectly fill up all empty spots in the dark!")
        print("Now your rival's prize winning crops are overrun with invasive flowers~")
        print("You are the Ultimate Midnight Saboteur!")
    elif end_reason == "caught":
        print("\nBusted! The rival farmer is onto you. Better luck next time...")
    elif planted >= int(max_turns * 0.75):
        print("\nGreat job! You seriously vandalised that field.")
        print("Your Rival is going to have a hard time fixing that!")
    else:
        print("\nNot bad, but the rival farmer will probably think it was just some weeds.")
        print("Not much sabotaged here.")

    # ── HIGH SCORE UPDATE ────────────────────────────────────────────
    # We reload saves here in case they ran multiple games this session.
    saves     = load_saves()
    prev_best = get_stat(saves, diff["label"], "high_score", -1)

    if planted > prev_best:
        set_stat(saves, diff["label"], "high_score", planted)
        if prev_best >= 0:
            print(f"\n⭐ NEW PERSONAL BEST on {diff['label']}! (Previous: {prev_best}/{max_turns})")
        else:
            print(f"\n⭐ First score saved for {diff['label']} mode!")
    else:
        print(f"\nPersonal best on {diff['label']}: {prev_best}/{max_turns}")

    # ── STREAK UPDATE ────────────────────────────────────────────────
    # A "good run" means you planted at least streak_threshold flowers.
    # The streak resets to 0 if you fall below the threshold.

    good_run         = planted >= diff["streak_threshold"]
    prev_streak      = get_stat(saves, diff["label"], "streak", 0)
    prev_best_streak = get_stat(saves, diff["label"], "best_streak", 0)
    new_streak       = prev_streak + 1 if good_run else 0
    new_best_streak  = max(prev_best_streak, new_streak)

    set_stat(saves, diff["label"], "streak", new_streak)
    set_stat(saves, diff["label"], "best_streak", new_best_streak)
    save_saves(saves)

    if good_run and new_streak > prev_best_streak and new_streak > 1:
        print(f"🔥 NEW BEST STREAK: {new_streak} in a row on {diff['label']}!")
    elif good_run and new_streak == 1:
        print(f"🔥 Streak started! Plant {diff['streak_threshold']}+ again to keep it going.")
    elif good_run:
        print(f"🔥 Streak: {new_streak} in a row!")
    elif prev_streak > 0:
        print(f"💔 Streak of {prev_streak} broken. (Need {diff['streak_threshold']}+ flowers to count)")

    if new_best_streak > 0:
        print(f"   Best streak on {diff['label']}: {new_best_streak} in a row")

    # ── SHARE CARD ───────────────────────────────────────────────────
    # Mirrors the "Copy Result" button from the web version.
    # Prints an emoji grid showing exactly what happened on the field.

    print("\n" + "=" * 60)
    share = input("\nPrint your result card? (y/n): ").strip().lower()
    if share == "y":
        card = build_share_card(player_grid, rival_grid, diff, planted, new_streak)
        print("\n" + "─" * 42)
        print(card)
        print("─" * 42)

    # ── PLAY AGAIN? ──────────────────────────────────────────────────
    again = input("\nSneak back in? (y/n): ").strip().lower()
    if again == "y":
        play_game()
    else:
        print("\nUntil next time, you midnight menace. 🌙\n")


# =============================================================================
# ENTRY POINT
# This block only runs when you execute the file directly (python midnight_farmer.py).
# It won't run if another script imports this file as a module.
# =============================================================================

if __name__ == "__main__":
    play_game()
