import json
import os

nations_data = {
    "germany": {
        "id": "de",
        "displayName": "Alemanha",
        "formation": "4-2-3-1",
        "primary": "#ffffff",
        "secondary": "#000000",
        "slug": "germany-21",
        "tactics": {
            "style": "Possession & High Press",
            "playerRoles": {"playmaker": "de-wirtz", "captain": "de-kimmich", "penaltyTaker": "de-havertz"}
        },
        "players": [
            {"name": "Marc-André ter Stegen", "dname": "Ter Stegen", "club": "FC Barcelona", "pos": "GK", "alt": [], "ovr": 89, "foot": "Right", "stats": [86, 85, 89, 90, 48, 88], "traits": ["SWEEPER_KEEPER", "CREATIVE_PASSER"]},
            {"name": "Manuel Neuer", "dname": "Neuer", "club": "Bayern Munich", "pos": "GK", "alt": [], "ovr": 87, "foot": "Right", "stats": [85, 85, 91, 86, 55, 87], "traits": ["SWEEPER_KEEPER", "BIG_GAME_PLAYER"]},
            {"name": "Antonio Rüdiger", "dname": "Rüdiger", "club": "Real Madrid", "pos": "CB", "alt": [], "ovr": 88, "foot": "Right", "stats": [82, 45, 68, 65, 86, 88], "traits": ["BALL_PLAYING_DEFENDER", "AERIAL_THREAT", "BIG_GAME_PLAYER"]},
            {"name": "Jonathan Tah", "dname": "Tah", "club": "Bayer Leverkusen", "pos": "CB", "alt": [], "ovr": 86, "foot": "Right", "stats": [78, 35, 62, 60, 85, 87], "traits": ["BALL_PLAYING_DEFENDER", "AERIAL_THREAT"]},
            {"name": "Nico Schlotterbeck", "dname": "Schlotterbeck", "club": "Borussia Dortmund", "pos": "CB", "alt": [], "ovr": 84, "foot": "Left", "stats": [76, 45, 72, 68, 84, 82], "traits": ["BALL_PLAYING_DEFENDER", "LEFT_FOOTED_CREATOR"]},
            {"name": "Joshua Kimmich", "dname": "Kimmich", "club": "Bayern Munich", "pos": "RB", "alt": ["CDM"], "ovr": 87, "foot": "Right", "stats": [72, 75, 88, 84, 83, 78], "traits": ["CREATIVE_PASSER", "DEEP_PLAYMAKER", "ATTACKING_FULLBACK", "SHORT_PASS_SPECIALIST"]},
            {"name": "Maximilian Mittelstädt", "dname": "Mittelstädt", "club": "VfB Stuttgart", "pos": "LB", "alt": ["LWB"], "ovr": 82, "foot": "Left", "stats": [80, 60, 78, 76, 78, 72], "traits": []},
            {"name": "Robert Andrich", "dname": "Andrich", "club": "Bayer Leverkusen", "pos": "CDM", "alt": ["CM"], "ovr": 83, "foot": "Right", "stats": [68, 78, 78, 75, 82, 85], "traits": []},
            {"name": "Aleksandar Pavlović", "dname": "Pavlović", "club": "Bayern Munich", "pos": "CDM", "alt": ["CM"], "ovr": 83, "foot": "Right", "stats": [72, 65, 82, 80, 78, 75], "traits": []},
            {"name": "Pascal Groß", "dname": "Groß", "club": "Borussia Dortmund", "pos": "CM", "alt": ["CDM", "RB"], "ovr": 82, "foot": "Right", "stats": [60, 76, 85, 80, 75, 74], "traits": []},
            {"name": "Florian Wirtz", "dname": "Wirtz", "club": "Bayer Leverkusen", "pos": "CAM", "alt": ["LW", "RW"], "ovr": 89, "foot": "Right", "stats": [82, 80, 88, 90, 55, 68], "traits": ["PLAYMAKER", "DRIBBLER", "BETWEEN_LINES", "POSITIONAL_MASTER", "FREE_ROLE"]},
            {"name": "Jamal Musiala", "dname": "Musiala", "club": "Bayern Munich", "pos": "CAM", "alt": ["LW", "CM"], "ovr": 89, "foot": "Right", "stats": [86, 80, 84, 93, 60, 65], "traits": ["DRIBBLER", "PLAYMAKER", "BALL_CARRIER", "INSIDE_FORWARD", "BETWEEN_LINES"]},
            {"name": "Leroy Sané", "dname": "Sané", "club": "Bayern Munich", "pos": "RM", "alt": ["RW", "LM"], "ovr": 85, "foot": "Left", "stats": [91, 81, 80, 86, 45, 68], "traits": ["SPEEDSTER", "INVERTED_WINGER", "LEFT_FOOTED_CREATOR", "DIRECT_RUNNER"]},
            {"name": "Serge Gnabry", "dname": "Gnabry", "club": "Bayern Munich", "pos": "RM", "alt": ["LM", "RW"], "ovr": 84, "foot": "Right", "stats": [84, 84, 78, 85, 48, 68], "traits": ["INSIDE_FORWARD", "DIRECT_RUNNER", "BIG_GAME_PLAYER"]},
            {"name": "Kai Havertz", "dname": "Havertz", "club": "Arsenal", "pos": "ST", "alt": ["CAM", "CF"], "ovr": 86, "foot": "Left", "stats": [82, 82, 82, 85, 55, 75], "traits": ["PLAYMAKING_FORWARD", "FREE_ROLE", "BETWEEN_LINES", "POSITIONAL_MASTER"]},
            {"name": "Niclas Füllkrug", "dname": "Füllkrug", "club": "West Ham", "pos": "ST", "alt": [], "ovr": 84, "foot": "Right", "stats": [72, 85, 72, 78, 45, 86], "traits": ["TARGET_FORWARD", "AERIAL_THREAT", "BOX_FINISHER"]}
        ]
    },
    "netherlands": {
        "id": "nl",
        "displayName": "Holanda",
        "formation": "4-3-3",
        "primary": "#f36c21",
        "secondary": "#ffffff",
        "slug": "netherlands-34",
        "tactics": {
            "style": "Total Football & Wing Play",
            "playerRoles": {"playmaker": "nl-dejong", "captain": "nl-vandijk", "penaltyTaker": "nl-memphis"}
        },
        "players": [
            {"name": "Bart Verbruggen", "dname": "Verbruggen", "club": "Brighton", "pos": "GK", "alt": [], "ovr": 83, "foot": "Right", "stats": [84, 80, 85, 84, 45, 80], "traits": []},
            {"name": "Mark Flekken", "dname": "Flekken", "club": "Brentford", "pos": "GK", "alt": [], "ovr": 82, "foot": "Right", "stats": [81, 78, 84, 82, 45, 80], "traits": []},
            {"name": "Virgil van Dijk", "dname": "Van Dijk", "club": "Liverpool", "pos": "CB", "alt": [], "ovr": 89, "foot": "Right", "stats": [78, 60, 72, 74, 89, 86], "traits": ["BALL_PLAYING_DEFENDER", "AERIAL_THREAT", "DEFENSIVE_ANCHOR", "BIG_GAME_PLAYER"]},
            {"name": "Matthijs de Ligt", "dname": "De Ligt", "club": "Manchester United", "pos": "CB", "alt": [], "ovr": 85, "foot": "Right", "stats": [74, 58, 65, 68, 84, 85], "traits": ["BALL_PLAYING_DEFENDER", "DEFENSIVE_ANCHOR"]},
            {"name": "Nathan Aké", "dname": "Aké", "club": "Manchester City", "pos": "CB", "alt": ["LB"], "ovr": 85, "foot": "Left", "stats": [78, 55, 75, 76, 85, 80], "traits": ["BALL_PLAYING_DEFENDER", "LEFT_FOOTED_CREATOR"]},
            {"name": "Denzel Dumfries", "dname": "Dumfries", "club": "Inter", "pos": "RWB", "alt": ["RB", "RM"], "ovr": 84, "foot": "Right", "stats": [85, 70, 75, 78, 78, 86], "traits": ["ATTACKING_FULLBACK", "AERIAL_THREAT", "LATE_RUNNER"]},
            {"name": "Jeremie Frimpong", "dname": "Frimpong", "club": "Bayer Leverkusen", "pos": "RWB", "alt": ["RM", "RW"], "ovr": 86, "foot": "Right", "stats": [94, 72, 78, 86, 75, 68], "traits": ["SPEEDSTER", "ATTACKING_FULLBACK", "DIRECT_RUNNER"]},
            {"name": "Frenkie de Jong", "dname": "De Jong", "club": "FC Barcelona", "pos": "CM", "alt": ["CDM"], "ovr": 87, "foot": "Right", "stats": [80, 68, 86, 88, 78, 76], "traits": ["DEEP_PLAYMAKER", "PRESS_RESISTANT", "BALL_CARRIER", "PLAYMAKER"]},
            {"name": "Tijjani Reijnders", "dname": "Reijnders", "club": "AC Milan", "pos": "CM", "alt": ["CDM", "CAM"], "ovr": 84, "foot": "Right", "stats": [82, 76, 82, 84, 72, 75], "traits": ["BOX_TO_BOX", "BALL_CARRIER"]},
            {"name": "Ryan Gravenberch", "dname": "Gravenberch", "club": "Liverpool", "pos": "CM", "alt": ["CDM"], "ovr": 84, "foot": "Right", "stats": [78, 75, 82, 85, 74, 78], "traits": ["PRESS_RESISTANT", "BALL_CARRIER"]},
            {"name": "Jerdy Schouten", "dname": "Schouten", "club": "PSV", "pos": "CDM", "alt": ["CM"], "ovr": 83, "foot": "Right", "stats": [70, 65, 80, 78, 80, 76], "traits": []},
            {"name": "Xavi Simons", "dname": "Simons", "club": "RB Leipzig", "pos": "CAM", "alt": ["RW", "LW"], "ovr": 86, "foot": "Right", "stats": [85, 80, 84, 88, 55, 65], "traits": ["DRIBBLER", "PLAYMAKER", "FREE_ROLE", "BETWEEN_LINES"]},
            {"name": "Cody Gakpo", "dname": "Gakpo", "club": "Liverpool", "pos": "LW", "alt": ["ST"], "ovr": 86, "foot": "Right", "stats": [86, 84, 80, 84, 45, 78], "traits": ["INVERTED_WINGER", "DIRECT_RUNNER", "BIG_GAME_PLAYER", "FINALIZER"]},
            {"name": "Donyell Malen", "dname": "Malen", "club": "Borussia Dortmund", "pos": "RW", "alt": ["ST"], "ovr": 83, "foot": "Right", "stats": [89, 80, 75, 84, 40, 70], "traits": []},
            {"name": "Memphis Depay", "dname": "Memphis", "club": "Corinthians", "pos": "ST", "alt": ["CF", "LW"], "ovr": 84, "foot": "Right", "stats": [78, 84, 82, 85, 35, 76], "traits": ["PLAYMAKING_FORWARD", "PENALTY_SPECIALIST"]},
            {"name": "Joshua Zirkzee", "dname": "Zirkzee", "club": "Manchester United", "pos": "ST", "alt": ["CF"], "ovr": 83, "foot": "Right", "stats": [76, 80, 78, 84, 45, 80], "traits": []}
        ]
    },
    "italy": {
        "id": "it",
        "displayName": "Itália",
        "formation": "3-4-2-1",
        "primary": "#0064a8",
        "secondary": "#ffffff",
        "slug": "italy-27",
        "tactics": {
            "style": "Catenaccio & Counter",
            "playerRoles": {"playmaker": "it-barella", "captain": "it-donnarumma", "penaltyTaker": "it-retegui"}
        },
        "players": [
            {"name": "Gianluigi Donnarumma", "dname": "Donnarumma", "club": "PSG", "pos": "GK", "alt": [], "ovr": 89, "foot": "Right", "stats": [90, 84, 80, 92, 55, 85], "traits": ["TRADITIONAL_KEEPER", "BIG_GAME_PLAYER"]},
            {"name": "Guglielmo Vicario", "dname": "Vicario", "club": "Tottenham", "pos": "GK", "alt": [], "ovr": 85, "foot": "Right", "stats": [86, 80, 78, 88, 50, 82], "traits": ["TRADITIONAL_KEEPER", "SWEEPER_KEEPER"]},
            {"name": "Alessandro Bastoni", "dname": "Bastoni", "club": "Inter", "pos": "CB", "alt": ["LWB"], "ovr": 87, "foot": "Left", "stats": [75, 45, 78, 76, 86, 84], "traits": ["BALL_PLAYING_DEFENDER", "LEFT_FOOTED_CREATOR", "CREATIVE_CROSSER"]},
            {"name": "Riccardo Calafiori", "dname": "Calafiori", "club": "Arsenal", "pos": "CB", "alt": ["LB"], "ovr": 84, "foot": "Left", "stats": [78, 55, 75, 78, 83, 82], "traits": ["BALL_PLAYING_DEFENDER", "LEFT_FOOTED_CREATOR", "BALL_CARRIER"]},
            {"name": "Alessandro Buongiorno", "dname": "Buongiorno", "club": "Napoli", "pos": "CB", "alt": [], "ovr": 84, "foot": "Left", "stats": [74, 40, 65, 68, 85, 84], "traits": ["DEFENSIVE_ANCHOR"]},
            {"name": "Giovanni Di Lorenzo", "dname": "Di Lorenzo", "club": "Napoli", "pos": "RB", "alt": ["RWB", "CB"], "ovr": 84, "foot": "Right", "stats": [80, 68, 76, 78, 82, 80], "traits": ["ATTACKING_FULLBACK"]},
            {"name": "Federico Dimarco", "dname": "Dimarco", "club": "Inter", "pos": "LWB", "alt": ["LB", "LM"], "ovr": 86, "foot": "Left", "stats": [82, 75, 86, 82, 78, 75], "traits": ["ATTACKING_FULLBACK", "CREATIVE_CROSSER", "LEFT_FOOTED_CREATOR"]},
            {"name": "Nicolò Barella", "dname": "Barella", "club": "Inter", "pos": "CM", "alt": ["CDM"], "ovr": 87, "foot": "Right", "stats": [80, 78, 85, 86, 78, 82], "traits": ["BOX_TO_BOX", "PRESS_RESISTANT", "PLAYMAKER", "LATE_RUNNER"]},
            {"name": "Sandro Tonali", "dname": "Tonali", "club": "Newcastle", "pos": "CM", "alt": ["CDM"], "ovr": 85, "foot": "Right", "stats": [82, 74, 82, 80, 80, 84], "traits": ["BOX_TO_BOX", "PRESSING_MIDFIELDER"]},
            {"name": "Davide Frattesi", "dname": "Frattesi", "club": "Inter", "pos": "CM", "alt": ["CAM"], "ovr": 83, "foot": "Right", "stats": [82, 78, 76, 80, 72, 78], "traits": []},
            {"name": "Lorenzo Pellegrini", "dname": "Pellegrini", "club": "Roma", "pos": "CAM", "alt": ["CM"], "ovr": 84, "foot": "Right", "stats": [75, 80, 85, 84, 68, 72], "traits": ["CREATIVE_PASSER", "LONG_SHOT_TAKER"]},
            {"name": "Federico Chiesa", "dname": "Chiesa", "club": "Liverpool", "pos": "RW", "alt": ["LW", "ST"], "ovr": 85, "foot": "Right", "stats": [90, 82, 78, 86, 45, 68], "traits": ["SPEEDSTER", "DIRECT_RUNNER", "INVERTED_WINGER"]},
            {"name": "Mattia Zaccagni", "dname": "Zaccagni", "club": "Lazio", "pos": "LW", "alt": ["LM"], "ovr": 82, "foot": "Right", "stats": [84, 76, 78, 84, 50, 65], "traits": []},
            {"name": "Giacomo Raspadori", "dname": "Raspadori", "club": "Napoli", "pos": "ST", "alt": ["CAM", "LW"], "ovr": 82, "foot": "Right", "stats": [82, 80, 78, 84, 40, 60], "traits": []},
            {"name": "Gianluca Scamacca", "dname": "Scamacca", "club": "Atalanta", "pos": "ST", "alt": [], "ovr": 83, "foot": "Right", "stats": [72, 84, 70, 78, 40, 82], "traits": []},
            {"name": "Mateo Retegui", "dname": "Retegui", "club": "Atalanta", "pos": "ST", "alt": [], "ovr": 83, "foot": "Right", "stats": [78, 84, 70, 78, 45, 84], "traits": []}
        ]
    },
    "belgium": {
        "id": "be",
        "displayName": "Bélgica",
        "formation": "4-2-3-1",
        "primary": "#e30613",
        "secondary": "#000000",
        "slug": "belgium-1325",
        "tactics": {
            "style": "Vertical Tiki-Taka",
            "playerRoles": {"playmaker": "be-debruyne", "captain": "be-debruyne", "penaltyTaker": "be-lukaku"}
        },
        "players": [
            {"name": "Thibaut Courtois", "dname": "Courtois", "club": "Real Madrid", "pos": "GK", "alt": [], "ovr": 89, "foot": "Left", "stats": [85, 88, 75, 90, 48, 86], "traits": ["TRADITIONAL_KEEPER", "BIG_GAME_PLAYER"]},
            {"name": "Koen Casteels", "dname": "Casteels", "club": "Al Qadsiah", "pos": "GK", "alt": [], "ovr": 84, "foot": "Left", "stats": [84, 82, 78, 85, 45, 82], "traits": ["TRADITIONAL_KEEPER"]},
            {"name": "Wout Faes", "dname": "Faes", "club": "Leicester City", "pos": "CB", "alt": [], "ovr": 81, "foot": "Right", "stats": [72, 45, 65, 68, 80, 82], "traits": []},
            {"name": "Arthur Theate", "dname": "Theate", "club": "Eintracht Frankfurt", "pos": "CB", "alt": ["LB"], "ovr": 81, "foot": "Left", "stats": [75, 55, 68, 70, 80, 80], "traits": []},
            {"name": "Timothy Castagne", "dname": "Castagne", "club": "Fulham", "pos": "RB", "alt": ["LB"], "ovr": 82, "foot": "Right", "stats": [78, 65, 75, 76, 78, 76], "traits": []},
            {"name": "Maxim De Cuyper", "dname": "De Cuyper", "club": "Club Brugge", "pos": "LB", "alt": ["LWB"], "ovr": 80, "foot": "Left", "stats": [82, 65, 76, 75, 72, 70], "traits": []},
            {"name": "Amadou Onana", "dname": "Onana", "club": "Aston Villa", "pos": "CDM", "alt": ["CM"], "ovr": 84, "foot": "Right", "stats": [75, 65, 75, 76, 82, 86], "traits": ["DEFENSIVE_ANCHOR", "PRESSING_MIDFIELDER"]},
            {"name": "Youri Tielemans", "dname": "Tielemans", "club": "Aston Villa", "pos": "CM", "alt": ["CDM"], "ovr": 84, "foot": "Right", "stats": [70, 80, 85, 82, 72, 75], "traits": ["DEEP_PLAYMAKER", "CREATIVE_PASSER"]},
            {"name": "Orel Mangala", "dname": "Mangala", "club": "Everton", "pos": "CDM", "alt": ["CM"], "ovr": 81, "foot": "Right", "stats": [72, 60, 75, 78, 76, 78], "traits": []},
            {"name": "Kevin De Bruyne", "dname": "De Bruyne", "club": "Manchester City", "pos": "CAM", "alt": ["CM"], "ovr": 90, "foot": "Right", "stats": [72, 85, 94, 87, 65, 78], "traits": ["PLAYMAKER", "CREATIVE_PASSER", "CREATIVE_CROSSER", "LONG_SHOT_TAKER", "POSITIONAL_MASTER"]},
            {"name": "Charles De Ketelaere", "dname": "De Ketelaere", "club": "Atalanta", "pos": "CAM", "alt": ["ST", "RW"], "ovr": 84, "foot": "Left", "stats": [80, 80, 82, 85, 55, 75], "traits": ["BETWEEN_LINES", "PLAYMAKING_FORWARD"]},
            {"name": "Jérémy Doku", "dname": "Doku", "club": "Manchester City", "pos": "LW", "alt": ["RW"], "ovr": 86, "foot": "Right", "stats": [94, 75, 78, 90, 40, 68], "traits": ["SPEEDSTER", "DRIBBLER", "DIRECT_RUNNER", "BALL_CARRIER"]},
            {"name": "Leandro Trossard", "dname": "Trossard", "club": "Arsenal", "pos": "LW", "alt": ["CAM", "ST"], "ovr": 85, "foot": "Right", "stats": [80, 82, 80, 86, 50, 60], "traits": ["INVERTED_WINGER", "BETWEEN_LINES", "PLAYMAKING_FORWARD"]},
            {"name": "Johan Bakayoko", "dname": "Bakayoko", "club": "PSV", "pos": "RW", "alt": ["RM"], "ovr": 83, "foot": "Left", "stats": [88, 76, 75, 86, 45, 68], "traits": []},
            {"name": "Romelu Lukaku", "dname": "Lukaku", "club": "Napoli", "pos": "ST", "alt": [], "ovr": 85, "foot": "Left", "stats": [80, 85, 75, 78, 40, 88], "traits": ["TARGET_FORWARD", "FINALIZER", "BOX_FINISHER"]},
            {"name": "Loïs Openda", "dname": "Openda", "club": "RB Leipzig", "pos": "ST", "alt": [], "ovr": 85, "foot": "Right", "stats": [93, 84, 72, 82, 40, 76], "traits": ["SPEEDSTER", "ATTACKS_DEPTH", "POACHER"]}
        ]
    },
    "switzerland": {
        "id": "ch",
        "displayName": "Suíça",
        "formation": "3-4-2-1",
        "primary": "#ff0000",
        "secondary": "#ffffff",
        "slug": "switzerland-47",
        "tactics": {
            "style": "Organized Press",
            "playerRoles": {"playmaker": "ch-xhaka", "captain": "ch-xhaka", "penaltyTaker": "ch-embolo"}
        },
        "players": [
            {"name": "Yann Sommer", "dname": "Sommer", "club": "Inter", "pos": "GK", "alt": [], "ovr": 86, "foot": "Right", "stats": [84, 82, 80, 88, 50, 85], "traits": ["SWEEPER_KEEPER", "BIG_GAME_PLAYER"]},
            {"name": "Gregor Kobel", "dname": "Kobel", "club": "Borussia Dortmund", "pos": "GK", "alt": [], "ovr": 88, "foot": "Right", "stats": [86, 84, 78, 90, 52, 84], "traits": ["TRADITIONAL_KEEPER"]},
            {"name": "Manuel Akanji", "dname": "Akanji", "club": "Manchester City", "pos": "CB", "alt": ["RB"], "ovr": 86, "foot": "Right", "stats": [80, 50, 75, 76, 86, 84], "traits": ["BALL_PLAYING_DEFENDER", "PRESS_RESISTANT"]},
            {"name": "Fabian Schär", "dname": "Schär", "club": "Newcastle", "pos": "CB", "alt": [], "ovr": 83, "foot": "Right", "stats": [65, 68, 75, 70, 82, 80], "traits": []},
            {"name": "Ricardo Rodriguez", "dname": "Rodriguez", "club": "Real Betis", "pos": "CB", "alt": ["LB"], "ovr": 81, "foot": "Left", "stats": [68, 70, 78, 76, 78, 75], "traits": []},
            {"name": "Silvan Widmer", "dname": "Widmer", "club": "Mainz 05", "pos": "RWB", "alt": ["RB"], "ovr": 80, "foot": "Right", "stats": [78, 65, 72, 74, 76, 78], "traits": []},
            {"name": "Dan Ndoye", "dname": "Ndoye", "club": "Bologna", "pos": "RW", "alt": ["RWB", "LW"], "ovr": 82, "foot": "Right", "stats": [88, 75, 74, 82, 60, 72], "traits": []},
            {"name": "Granit Xhaka", "dname": "Xhaka", "club": "Bayer Leverkusen", "pos": "CM", "alt": ["CDM"], "ovr": 86, "foot": "Left", "stats": [65, 78, 88, 80, 80, 84], "traits": ["DEEP_PLAYMAKER", "CREATIVE_PASSER", "LEFT_FOOTED_CREATOR", "BIG_GAME_PLAYER"]},
            {"name": "Remo Freuler", "dname": "Freuler", "club": "Bologna", "pos": "CM", "alt": ["CDM"], "ovr": 82, "foot": "Right", "stats": [70, 72, 78, 76, 78, 80], "traits": []},
            {"name": "Denis Zakaria", "dname": "Zakaria", "club": "Monaco", "pos": "CDM", "alt": ["CM"], "ovr": 83, "foot": "Right", "stats": [82, 68, 76, 80, 80, 84], "traits": []},
            {"name": "Michel Aebischer", "dname": "Aebischer", "club": "Bologna", "pos": "CM", "alt": ["LM"], "ovr": 81, "foot": "Right", "stats": [74, 72, 78, 76, 74, 75], "traits": []},
            {"name": "Fabian Rieder", "dname": "Rieder", "club": "VfB Stuttgart", "pos": "CAM", "alt": ["CM"], "ovr": 80, "foot": "Left", "stats": [75, 75, 78, 78, 65, 72], "traits": []},
            {"name": "Ruben Vargas", "dname": "Vargas", "club": "FC Augsburg", "pos": "LW", "alt": ["RW", "CAM"], "ovr": 81, "foot": "Right", "stats": [86, 75, 75, 82, 50, 65], "traits": []},
            {"name": "Breel Embolo", "dname": "Embolo", "club": "Monaco", "pos": "ST", "alt": [], "ovr": 82, "foot": "Right", "stats": [84, 78, 72, 80, 45, 85], "traits": []},
            {"name": "Zeki Amdouni", "dname": "Amdouni", "club": "Benfica", "pos": "ST", "alt": ["CAM"], "ovr": 80, "foot": "Right", "stats": [82, 78, 72, 78, 40, 70], "traits": []},
            {"name": "Noah Okafor", "dname": "Okafor", "club": "AC Milan", "pos": "LW", "alt": ["ST"], "ovr": 81, "foot": "Right", "stats": [88, 78, 70, 80, 40, 72], "traits": []}
        ]
    },
    "austria": {
        "id": "at",
        "displayName": "Áustria",
        "formation": "4-2-3-1",
        "primary": "#ed2939",
        "secondary": "#ffffff",
        "slug": "austria-25",
        "tactics": {
            "style": "Gegenpressing",
            "playerRoles": {"playmaker": "at-sabitzer", "captain": "at-alaba", "penaltyTaker": "at-arnautovic"}
        },
        "players": [
            {"name": "Patrick Pentz", "dname": "Pentz", "club": "Brøndby IF", "pos": "GK", "alt": [], "ovr": 80, "foot": "Right", "stats": [82, 76, 78, 82, 45, 78], "traits": []},
            {"name": "Alexander Schlager", "dname": "A. Schlager", "club": "RB Salzburg", "pos": "GK", "alt": [], "ovr": 80, "foot": "Right", "stats": [80, 78, 75, 82, 45, 76], "traits": []},
            {"name": "David Alaba", "dname": "Alaba", "club": "Real Madrid", "pos": "CB", "alt": ["LB", "CM"], "ovr": 85, "foot": "Left", "stats": [78, 72, 84, 82, 84, 78], "traits": ["BALL_PLAYING_DEFENDER", "LEFT_FOOTED_CREATOR", "CREATIVE_PASSER"]},
            {"name": "Kevin Danso", "dname": "Danso", "club": "Lens", "pos": "CB", "alt": [], "ovr": 83, "foot": "Right", "stats": [75, 45, 65, 68, 84, 86], "traits": []},
            {"name": "Philipp Lienhart", "dname": "Lienhart", "club": "SC Freiburg", "pos": "CB", "alt": [], "ovr": 82, "foot": "Right", "stats": [68, 50, 68, 70, 82, 80], "traits": []},
            {"name": "Stefan Posch", "dname": "Posch", "club": "Bologna", "pos": "RB", "alt": ["CB"], "ovr": 82, "foot": "Right", "stats": [75, 60, 72, 70, 82, 82], "traits": []},
            {"name": "Phillipp Mwene", "dname": "Mwene", "club": "Mainz 05", "pos": "LB", "alt": ["RB", "LWB"], "ovr": 80, "foot": "Right", "stats": [82, 60, 72, 75, 75, 72], "traits": []},
            {"name": "Nicolas Seiwald", "dname": "Seiwald", "club": "RB Leipzig", "pos": "CDM", "alt": ["CM"], "ovr": 81, "foot": "Right", "stats": [76, 65, 76, 78, 78, 78], "traits": []},
            {"name": "Konrad Laimer", "dname": "Laimer", "club": "Bayern Munich", "pos": "CM", "alt": ["CDM", "RB"], "ovr": 84, "foot": "Right", "stats": [82, 70, 78, 80, 80, 82], "traits": ["PRESSING_MIDFIELDER", "BOX_TO_BOX", "BALL_CARRIER"]},
            {"name": "Xaver Schlager", "dname": "X. Schlager", "club": "RB Leipzig", "pos": "CM", "alt": ["CDM"], "ovr": 83, "foot": "Left", "stats": [75, 72, 78, 78, 78, 80], "traits": []},
            {"name": "Florian Grillitsch", "dname": "Grillitsch", "club": "TSG Hoffenheim", "pos": "CDM", "alt": ["CM", "CB"], "ovr": 81, "foot": "Right", "stats": [65, 68, 80, 78, 78, 75], "traits": []},
            {"name": "Marcel Sabitzer", "dname": "Sabitzer", "club": "Borussia Dortmund", "pos": "CAM", "alt": ["CM", "LM"], "ovr": 84, "foot": "Right", "stats": [78, 82, 84, 82, 72, 78], "traits": ["BOX_TO_BOX", "LONG_SHOT_TAKER", "LATE_RUNNER"]},
            {"name": "Christoph Baumgartner", "dname": "Baumgartner", "club": "RB Leipzig", "pos": "CAM", "alt": ["CM", "LM"], "ovr": 83, "foot": "Right", "stats": [78, 78, 78, 82, 65, 75], "traits": []},
            {"name": "Patrick Wimmer", "dname": "Wimmer", "club": "VfL Wolfsburg", "pos": "RW", "alt": ["RM", "CAM"], "ovr": 81, "foot": "Right", "stats": [84, 75, 76, 82, 60, 74], "traits": []},
            {"name": "Romano Schmid", "dname": "Schmid", "club": "Werder Bremen", "pos": "LM", "alt": ["CAM"], "ovr": 80, "foot": "Right", "stats": [82, 74, 76, 80, 50, 68], "traits": []},
            {"name": "Marko Arnautović", "dname": "Arnautović", "club": "Inter", "pos": "ST", "alt": ["CF"], "ovr": 81, "foot": "Right", "stats": [68, 80, 76, 82, 40, 82], "traits": []},
            {"name": "Michael Gregoritsch", "dname": "Gregoritsch", "club": "SC Freiburg", "pos": "ST", "alt": ["CF"], "ovr": 81, "foot": "Left", "stats": [70, 80, 72, 75, 45, 84], "traits": []}
        ]
    },
    "norway": {
        "id": "no",
        "displayName": "Noruega",
        "formation": "4-3-3",
        "primary": "#d52b1e",
        "secondary": "#00205b",
        "slug": "norway-36",
        "tactics": {
            "style": "Direct Play & High Intensity",
            "playerRoles": {"playmaker": "no-odegaard", "captain": "no-odegaard", "penaltyTaker": "no-haaland"}
        },
        "players": [
            {"name": "Ørjan Nyland", "dname": "Nyland", "club": "Sevilla", "pos": "GK", "alt": [], "ovr": 78, "foot": "Right", "stats": [78, 76, 72, 80, 45, 75], "traits": []},
            {"name": "Jacob Karlstrøm", "dname": "Karlstrøm", "club": "IFK Göteborg", "pos": "GK", "alt": [], "ovr": 76, "foot": "Right", "stats": [76, 72, 70, 78, 40, 74], "traits": []},
            {"name": "Kristoffer Ajer", "dname": "Ajer", "club": "Brentford", "pos": "CB", "alt": ["RB"], "ovr": 80, "foot": "Right", "stats": [74, 50, 68, 72, 80, 82], "traits": []},
            {"name": "Leo Østigård", "dname": "Østigård", "club": "Rennes", "pos": "CB", "alt": [], "ovr": 79, "foot": "Right", "stats": [70, 45, 62, 65, 78, 82], "traits": []},
            {"name": "Andreas Hanche-Olsen", "dname": "Hanche-Olsen", "club": "Mainz 05", "pos": "CB", "alt": [], "ovr": 79, "foot": "Right", "stats": [72, 40, 60, 65, 80, 80], "traits": []},
            {"name": "Julian Ryerson", "dname": "Ryerson", "club": "Borussia Dortmund", "pos": "RB", "alt": ["LB", "RM"], "ovr": 82, "foot": "Right", "stats": [80, 68, 74, 76, 78, 82], "traits": []},
            {"name": "Birger Meling", "dname": "Meling", "club": "FC Copenhagen", "pos": "LB", "alt": ["LWB"], "ovr": 78, "foot": "Left", "stats": [78, 60, 72, 74, 75, 70], "traits": []},
            {"name": "Sander Berge", "dname": "Berge", "club": "Burnley", "pos": "CDM", "alt": ["CM"], "ovr": 81, "foot": "Right", "stats": [72, 68, 75, 76, 78, 86], "traits": []},
            {"name": "Martin Ødegaard", "dname": "Ødegaard", "club": "Arsenal", "pos": "CM", "alt": ["CAM"], "ovr": 89, "foot": "Left", "stats": [78, 84, 90, 88, 65, 70], "traits": ["PLAYMAKER", "CREATIVE_PASSER", "LEFT_FOOTED_CREATOR", "POSITIONAL_MASTER", "BETWEEN_LINES"]},
            {"name": "Fredrik Aursnes", "dname": "Aursnes", "club": "Benfica", "pos": "CM", "alt": ["CDM", "LM"], "ovr": 82, "foot": "Right", "stats": [75, 70, 78, 78, 76, 78], "traits": []},
            {"name": "Kristian Thorstvedt", "dname": "Thorstvedt", "club": "Sassuolo", "pos": "CM", "alt": ["CAM"], "ovr": 80, "foot": "Left", "stats": [72, 76, 74, 76, 68, 80], "traits": []},
            {"name": "Oscar Bobb", "dname": "Bobb", "club": "Manchester City", "pos": "RW", "alt": ["CAM"], "ovr": 84, "foot": "Left", "stats": [86, 78, 80, 88, 45, 60], "traits": ["DRIBBLER", "INSIDE_FORWARD", "LEFT_FOOTED_CREATOR"]},
            {"name": "Antonio Nusa", "dname": "Nusa", "club": "RB Leipzig", "pos": "LW", "alt": ["RW"], "ovr": 82, "foot": "Right", "stats": [88, 75, 76, 86, 40, 60], "traits": []},
            {"name": "Erling Haaland", "dname": "Haaland", "club": "Manchester City", "pos": "ST", "alt": [], "ovr": 91, "foot": "Left", "stats": [89, 93, 68, 80, 45, 88], "traits": ["FINALIZER", "SPEEDSTER", "TARGET_FORWARD", "ATTACKS_DEPTH", "AERIAL_THREAT", "BOX_FINISHER"]},
            {"name": "Alexander Sørloth", "dname": "Sørloth", "club": "Atlético Madrid", "pos": "ST", "alt": ["RW"], "ovr": 85, "foot": "Left", "stats": [82, 85, 74, 80, 45, 86], "traits": ["TARGET_FORWARD", "AERIAL_THREAT", "BOX_FINISHER"]},
            {"name": "Jørgen Strand Larsen", "dname": "Strand Larsen", "club": "Wolves", "pos": "ST", "alt": [], "ovr": 81, "foot": "Right", "stats": [76, 80, 70, 75, 40, 84], "traits": []}
        ]
    }
}

squads_output = {}
meta_face_stats = {}
meta_gk_ids = []
meta_known_traits = {}
meta_tactics = {}

for team_key, tdata in nations_data.items():
    country_code = tdata["id"]
    
    squads_output[team_key] = {
        "nation": tdata["displayName"],
        "displayName": tdata["displayName"],
        "colors": {
            "primary": tdata["primary"],
            "secondary": tdata["secondary"]
        },
        "formation": tdata["formation"],
        "source": f"https://www.fcratings.com/nations/{tdata['slug']}",
        "players": []
    }
    
    meta_tactics[team_key] = {
        "teamId": team_key,
        "teamName": tdata["displayName"],
        "style": tdata["tactics"]["style"],
        "playerRoles": tdata["tactics"]["playerRoles"]
    }
    
    for p in tdata["players"]:
        last_name = p["dname"].split()[-1].lower()
        if " " in p["dname"]:
            # e.g., De Bruyne -> debruyne, De Ligt -> deligt, Van Dijk -> vandijk
            last_name = p["dname"].replace(" ", "").lower()
            
        # specifically fix some names to remove special chars for ID
        replacements = {"ü": "u", "é": "e", "á": "a", "ó": "o", "ö": "o", "ä": "a", "ø": "o", "ć": "c", "è": "e", "ñ": "n"}
        for k, v in replacements.items():
            last_name = last_name.replace(k, v)
        last_name = last_name.replace(".", "")
            
        pid = f"{country_code}-{last_name}"
        
        squads_output[team_key]["players"].append({
            "id": pid,
            "realName": p["name"],
            "displayName": p["dname"],
            "nationality": tdata["displayName"],
            "club": p["club"],
            "position": p["pos"],
            "alternatePositions": p["alt"],
            "overall": p["ovr"],
            "preferredFoot": p["foot"],
            "source": "EA_FC_26_IMPORTED",
            "sourceUrl": f"https://www.fcratings.com/nations/{tdata['slug']}",
            "lastUpdated": "2026-06-14"
        })
        
        meta_face_stats[pid] = p["stats"]
        if p["pos"] == "GK":
            meta_gk_ids.append(pid)
            
        if p["ovr"] >= 84 and len(p["traits"]) > 0:
            meta_known_traits[pid] = p["traits"]

with open("C:/Users/dedsf/futsim/data/ea-fc-26/squads-europe1.json", "w", encoding="utf-8") as f:
    json.dump(squads_output, f, ensure_ascii=False, indent=2)

with open("C:/Users/dedsf/futsim/data/ea-fc-26/generated-europe1-meta.json", "w", encoding="utf-8") as f:
    json.dump({
        "faceStats": meta_face_stats,
        "gkIds": meta_gk_ids,
        "knownTraits": meta_known_traits,
        "tactics": meta_tactics
    }, f, ensure_ascii=False, indent=2)

print("SUCCESS")
