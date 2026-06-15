const fs = require('fs');
const path = require('path');

const squads = {
  "morocco": {
    "nation": "Morocco", "displayName": "Marrocos",
    "colors": { "primary": "#c1272d", "secondary": "#006233" },
    "formation": "4-3-3",
    "source": "https://www.fcratings.com/nations/morocco-37",
    "tacticalProfile": {
      "style": "Attacking / Possession",
      "formation": "4-3-3",
      "playerRoles": {
        "playmaker": "ma-ziyech",
        "targetMan": "ma-ennesyri"
      }
    },
    "players": [
      { "id": "ma-bounou", "realName": "Yassine Bounou", "displayName": "Bounou", "nationality": "Morocco", "club": "Al Hilal", "position": "GK", "overall": 84, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [84, 81, 78, 86, 50, 82], "traits": ["TRADITIONAL_KEEPER"] },
      { "id": "ma-hakimi", "realName": "Achraf Hakimi", "displayName": "Hakimi", "nationality": "Morocco", "club": "Paris SG", "position": "RB", "alternatePositions": ["RWB"], "overall": 85, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [92, 75, 82, 83, 78, 79], "traits": ["ATTACKING_FULLBACK", "SPEEDSTER"] },
      { "id": "ma-aguerd", "realName": "Nayef Aguerd", "displayName": "Aguerd", "nationality": "Morocco", "club": "West Ham", "position": "CB", "overall": 81, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [68, 45, 65, 68, 82, 78], "traits": [] },
      { "id": "ma-saiss", "realName": "Romain Saïss", "displayName": "Saïss", "nationality": "Morocco", "club": "Al Shabab", "position": "CB", "overall": 79, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [60, 55, 65, 64, 80, 81], "traits": [] },
      { "id": "ma-mazraoui", "realName": "Noussair Mazraoui", "displayName": "Mazraoui", "nationality": "Morocco", "club": "Bayern Munich", "position": "LB", "alternatePositions": ["RB"], "overall": 82, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [80, 68, 80, 83, 78, 74], "traits": [] },
      { "id": "ma-amrabat", "realName": "Sofyan Amrabat", "displayName": "Amrabat", "nationality": "Morocco", "club": "Man United", "position": "CDM", "overall": 80, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 60, 77, 75, 78, 84], "traits": [] },
      { "id": "ma-ounahi", "realName": "Azzedine Ounahi", "displayName": "Ounahi", "nationality": "Morocco", "club": "Marseille", "position": "CM", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 68, 77, 83, 62, 55], "traits": [] },
      { "id": "ma-brahim", "realName": "Brahim Díaz", "displayName": "Brahim", "nationality": "Morocco", "club": "Real Madrid", "position": "CAM", "alternatePositions": ["RW"], "overall": 84, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 76, 81, 88, 32, 54], "traits": ["DRIBBLER", "BETWEEN_LINES"] },
      { "id": "ma-ziyech", "realName": "Hakim Ziyech", "displayName": "Ziyech", "nationality": "Morocco", "club": "Galatasaray", "position": "RW", "alternatePositions": ["CAM"], "overall": 83, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [72, 79, 86, 82, 50, 66], "traits": [] },
      { "id": "ma-ennesyri", "realName": "Youssef En-Nesyri", "displayName": "En-Nesyri", "nationality": "Morocco", "club": "Sevilla", "position": "ST", "overall": 83, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [86, 83, 62, 75, 45, 84], "traits": [] },
      { "id": "ma-adli", "realName": "Amine Adli", "displayName": "Adli", "nationality": "Morocco", "club": "Bayer Leverkusen", "position": "LW", "overall": 79, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [88, 74, 73, 81, 40, 65], "traits": [] },
      { "id": "ma-elkaabi", "realName": "Ayoub El Kaabi", "displayName": "El Kaabi", "nationality": "Morocco", "club": "Olympiacos", "position": "ST", "overall": 78, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [80, 80, 65, 74, 35, 75], "traits": [] },
      { "id": "ma-harit", "realName": "Amine Harit", "displayName": "Harit", "nationality": "Morocco", "club": "Marseille", "position": "CAM", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 70, 78, 83, 40, 55], "traits": [] },
      { "id": "ma-saibari", "realName": "Ismael Saibari", "displayName": "Saibari", "nationality": "Morocco", "club": "PSV", "position": "CM", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 73, 74, 79, 65, 78], "traits": [] },
      { "id": "ma-richardson", "realName": "Amir Richardson", "displayName": "Richardson", "nationality": "Morocco", "club": "Reims", "position": "CM", "overall": 75, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [70, 68, 72, 75, 70, 75], "traits": [] },
      { "id": "ma-elkajoui", "realName": "Munir El Kajoui", "displayName": "Munir", "nationality": "Morocco", "club": "Al Wehda", "position": "GK", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [75, 72, 68, 76, 45, 74], "traits": [] }
    ]
  },
  "senegal": {
    "nation": "Senegal", "displayName": "Senegal",
    "colors": { "primary": "#00853f", "secondary": "#fdef42" },
    "formation": "4-3-3",
    "source": "https://www.fcratings.com/nations/senegal-41",
    "tacticalProfile": {
      "style": "Athletic / Direct",
      "formation": "4-3-3",
      "playerRoles": {
        "playmaker": "sn-mane",
        "targetMan": "sn-jackson"
      }
    },
    "players": [
      { "id": "sn-mendy", "realName": "Édouard Mendy", "displayName": "Mendy", "nationality": "Senegal", "club": "Al Ahli", "position": "GK", "overall": 82, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 80, 75, 84, 45, 80], "traits": [] },
      { "id": "sn-koulibaly", "realName": "Kalidou Koulibaly", "displayName": "Koulibaly", "nationality": "Senegal", "club": "Al Hilal", "position": "CB", "overall": 83, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 40, 60, 65, 84, 85], "traits": [] },
      { "id": "sn-niakhate", "realName": "Moussa Niakhaté", "displayName": "Niakhaté", "nationality": "Senegal", "club": "Nott'm Forest", "position": "CB", "overall": 77, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [70, 45, 62, 64, 76, 80], "traits": [] },
      { "id": "sn-jakobs", "realName": "Ismail Jakobs", "displayName": "Jakobs", "nationality": "Senegal", "club": "Monaco", "position": "LB", "overall": 75, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [86, 55, 68, 72, 70, 75], "traits": [] },
      { "id": "sn-diatta", "realName": "Krépin Diatta", "displayName": "Diatta", "nationality": "Senegal", "club": "Monaco", "position": "RB", "alternatePositions": ["RM"], "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [88, 68, 70, 78, 65, 65], "traits": [] },
      { "id": "sn-gueye", "realName": "Idrissa Gueye", "displayName": "Gueye", "nationality": "Senegal", "club": "Everton", "position": "CDM", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 60, 72, 74, 78, 76], "traits": [] },
      { "id": "sn-sarr", "realName": "Pape Matar Sarr", "displayName": "Sarr", "nationality": "Senegal", "club": "Tottenham", "position": "CM", "overall": 80, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 72, 78, 79, 75, 76], "traits": [] },
      { "id": "sn-camara", "realName": "Lamine Camara", "displayName": "Camara", "nationality": "Senegal", "club": "Metz", "position": "CM", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 68, 76, 75, 68, 72], "traits": [] },
      { "id": "sn-mane", "realName": "Sadio Mané", "displayName": "Mané", "nationality": "Senegal", "club": "Al Nassr", "position": "LW", "overall": 85, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 82, 80, 86, 45, 75], "traits": ["SPEEDSTER", "INSIDE_FORWARD"] },
      { "id": "sn-isarr", "realName": "Ismaïla Sarr", "displayName": "I. Sarr", "nationality": "Senegal", "club": "Marseille", "position": "RW", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [92, 74, 72, 80, 35, 68], "traits": [] },
      { "id": "sn-jackson", "realName": "Nicolas Jackson", "displayName": "Jackson", "nationality": "Senegal", "club": "Chelsea", "position": "ST", "overall": 81, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 78, 70, 82, 40, 76], "traits": [] },
      { "id": "sn-diallo", "realName": "Habib Diallo", "displayName": "Diallo", "nationality": "Senegal", "club": "Al Shabab", "position": "ST", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 78, 62, 72, 35, 78], "traits": [] },
      { "id": "sn-dieng", "realName": "Bamba Dieng", "displayName": "Dieng", "nationality": "Senegal", "club": "Lorient", "position": "ST", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 74, 60, 75, 30, 65], "traits": [] },
      { "id": "sn-dia", "realName": "Boulaye Dia", "displayName": "Dia", "nationality": "Senegal", "club": "Salernitana", "position": "ST", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 80, 68, 78, 35, 70], "traits": [] },
      { "id": "sn-ciss", "realName": "Pathé Ciss", "displayName": "Ciss", "nationality": "Senegal", "club": "Rayo Vallecano", "position": "CDM", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 65, 72, 73, 74, 76], "traits": [] },
      { "id": "sn-fmendy", "realName": "Formose Mendy", "displayName": "F. Mendy", "nationality": "Senegal", "club": "Lorient", "position": "CB", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 35, 55, 58, 70, 75], "traits": [] }
    ]
  },
  "nigeria": {
    "nation": "Nigeria", "displayName": "Nigéria",
    "colors": { "primary": "#008751", "secondary": "#ffffff" },
    "formation": "4-2-3-1",
    "source": "https://www.fcratings.com/nations/nigeria-38",
    "tacticalProfile": {
      "style": "Counter Attack",
      "formation": "4-2-3-1",
      "playerRoles": {
        "playmaker": "ng-iwobi",
        "targetMan": "ng-osimhen"
      }
    },
    "players": [
      { "id": "ng-nwabali", "realName": "Stanley Nwabali", "displayName": "Nwabali", "nationality": "Nigeria", "club": "Chippa United", "position": "GK", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [75, 70, 68, 76, 45, 72], "traits": [] },
      { "id": "ng-ekong", "realName": "William Troost-Ekong", "displayName": "Troost-Ekong", "nationality": "Nigeria", "club": "PAOK", "position": "CB", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 45, 58, 60, 76, 80], "traits": [] },
      { "id": "ng-ajayi", "realName": "Semi Ajayi", "displayName": "Ajayi", "nationality": "Nigeria", "club": "West Brom", "position": "CB", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 40, 55, 62, 72, 82], "traits": [] },
      { "id": "ng-bassey", "realName": "Calvin Bassey", "displayName": "Bassey", "nationality": "Nigeria", "club": "Fulham", "position": "CB", "alternatePositions": ["LB"], "overall": 76, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [78, 45, 64, 68, 74, 84], "traits": [] },
      { "id": "ng-aina", "realName": "Ola Aina", "displayName": "Aina", "nationality": "Nigeria", "club": "Nott'm Forest", "position": "RB", "alternatePositions": ["LB"], "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 60, 70, 76, 72, 74], "traits": [] },
      { "id": "ng-onyeka", "realName": "Frank Onyeka", "displayName": "Onyeka", "nationality": "Nigeria", "club": "Brentford", "position": "CDM", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 60, 68, 72, 72, 80], "traits": [] },
      { "id": "ng-iwobi", "realName": "Alex Iwobi", "displayName": "Iwobi", "nationality": "Nigeria", "club": "Fulham", "position": "CM", "alternatePositions": ["CAM"], "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 70, 78, 82, 60, 68], "traits": [] },
      { "id": "ng-lookman", "realName": "Ademola Lookman", "displayName": "Lookman", "nationality": "Nigeria", "club": "Atalanta", "position": "LW", "alternatePositions": ["ST"], "overall": 84, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [88, 83, 78, 86, 40, 68], "traits": ["SPEEDSTER", "BOX_FINISHER"] },
      { "id": "ng-chukwueze", "realName": "Samuel Chukwueze", "displayName": "Chukwueze", "nationality": "Nigeria", "club": "Milan", "position": "RW", "overall": 80, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [90, 74, 72, 84, 38, 60], "traits": [] },
      { "id": "ng-osimhen", "realName": "Victor Osimhen", "displayName": "Osimhen", "nationality": "Nigeria", "club": "Napoli", "position": "ST", "overall": 88, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [90, 86, 66, 82, 42, 84], "traits": ["SPEEDSTER", "BOX_FINISHER", "AERIAL_THREAT"] },
      { "id": "ng-boniface", "realName": "Victor Boniface", "displayName": "Boniface", "nationality": "Nigeria", "club": "Bayer Leverkusen", "position": "ST", "overall": 83, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 82, 72, 84, 40, 86], "traits": [] },
      { "id": "ng-iheanacho", "realName": "Kelechi Iheanacho", "displayName": "Iheanacho", "nationality": "Nigeria", "club": "Leicester City", "position": "ST", "overall": 77, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [76, 78, 74, 78, 40, 68], "traits": [] },
      { "id": "ng-awoniyi", "realName": "Taiwo Awoniyi", "displayName": "Awoniyi", "nationality": "Nigeria", "club": "Nott'm Forest", "position": "ST", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 76, 62, 74, 40, 84], "traits": [] },
      { "id": "ng-ndidi", "realName": "Wilfred Ndidi", "displayName": "Ndidi", "nationality": "Nigeria", "club": "Leicester City", "position": "CDM", "overall": 79, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 65, 72, 74, 80, 82], "traits": [] },
      { "id": "ng-simon", "realName": "Moses Simon", "displayName": "Simon", "nationality": "Nigeria", "club": "Nantes", "position": "LM", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [88, 70, 72, 80, 45, 62], "traits": [] },
      { "id": "ng-osayi", "realName": "Bright Osayi-Samuel", "displayName": "Osayi-Samuel", "nationality": "Nigeria", "club": "Fenerbahce", "position": "RB", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [90, 62, 68, 76, 70, 74], "traits": [] }
    ]
  },
  "egypt": {
    "nation": "Egypt", "displayName": "Egito",
    "colors": { "primary": "#ce1126", "secondary": "#ffffff" },
    "formation": "4-3-3",
    "source": "https://www.fcratings.com/nations/egypt-30",
    "tacticalProfile": {
      "style": "Balanced",
      "formation": "4-3-3",
      "playerRoles": {
        "playmaker": "eg-salah",
        "targetMan": "eg-mostafa"
      }
    },
    "players": [
      { "id": "eg-elshenawy", "realName": "Mohamed El Shenawy", "displayName": "El Shenawy", "nationality": "Egypt", "club": "Al Ahly", "position": "GK", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 74, 70, 80, 45, 76], "traits": [] },
      { "id": "eg-hegazi", "realName": "Ahmed Hegazi", "displayName": "Hegazi", "nationality": "Egypt", "club": "Al Ittihad", "position": "CB", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [55, 45, 58, 60, 76, 84], "traits": [] },
      { "id": "eg-abdelmonem", "realName": "Mohamed Abdelmonem", "displayName": "Abdelmonem", "nationality": "Egypt", "club": "Al Ahly", "position": "CB", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 40, 58, 64, 74, 76], "traits": [] },
      { "id": "eg-hany", "realName": "Mohamed Hany", "displayName": "Hany", "nationality": "Egypt", "club": "Al Ahly", "position": "RB", "overall": 71, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [80, 50, 65, 70, 68, 68], "traits": [] },
      { "id": "eg-fatouh", "realName": "Ahmed Fatouh", "displayName": "Fatouh", "nationality": "Egypt", "club": "Zamalek", "position": "LB", "overall": 72, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [82, 55, 68, 72, 66, 65], "traits": [] },
      { "id": "eg-elneny", "realName": "Mohamed Elneny", "displayName": "Elneny", "nationality": "Egypt", "club": "Arsenal", "position": "CDM", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 65, 76, 72, 72, 70], "traits": [] },
      { "id": "eg-attia", "realName": "Marwan Attia", "displayName": "Attia", "nationality": "Egypt", "club": "Al Ahly", "position": "CDM", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 60, 70, 72, 68, 74], "traits": [] },
      { "id": "eg-ashour", "realName": "Emam Ashour", "displayName": "Ashour", "nationality": "Egypt", "club": "Al Ahly", "position": "CM", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 72, 74, 76, 65, 70], "traits": [] },
      { "id": "eg-salah", "realName": "Mohamed Salah", "displayName": "Salah", "nationality": "Egypt", "club": "Liverpool", "position": "RW", "overall": 88, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [88, 86, 82, 87, 45, 74], "traits": ["SPEEDSTER", "BOX_FINISHER", "LEFT_FOOTED_CREATOR"] },
      { "id": "eg-trezeguet", "realName": "Trezeguet", "displayName": "Trezeguet", "nationality": "Egypt", "club": "Trabzonspor", "position": "LW", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 74, 72, 80, 45, 65], "traits": [] },
      { "id": "eg-marmoush", "realName": "Omar Marmoush", "displayName": "Marmoush", "nationality": "Egypt", "club": "Eintracht Frankfurt", "position": "ST", "overall": 81, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [88, 82, 75, 82, 40, 74], "traits": [] },
      { "id": "eg-mostafa", "realName": "Mostafa Mohamed", "displayName": "Mostafa", "nationality": "Egypt", "club": "Nantes", "position": "ST", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 78, 64, 74, 40, 82], "traits": [] },
      { "id": "eg-zizo", "realName": "Zizo", "displayName": "Zizo", "nationality": "Egypt", "club": "Zamalek", "position": "RW", "alternatePositions": ["CAM"], "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 72, 75, 78, 45, 65], "traits": [] },
      { "id": "eg-fathi", "realName": "Hamdi Fathi", "displayName": "Fathi", "nationality": "Egypt", "club": "Al Wakrah", "position": "CDM", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 65, 70, 70, 72, 75], "traits": [] },
      { "id": "eg-koka", "realName": "Ahmed Hassan", "displayName": "Koka", "nationality": "Egypt", "club": "Alanyaspor", "position": "ST", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 74, 60, 70, 35, 78], "traits": [] },
      { "id": "eg-gabal", "realName": "Gabaski", "displayName": "Gabaski", "nationality": "Egypt", "club": "National Bank", "position": "GK", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 70, 65, 75, 40, 70], "traits": [] }
    ]
  },
  "ivorycoast": {
    "nation": "Côte d'Ivoire", "displayName": "Costa do Marfim",
    "colors": { "primary": "#f77f00", "secondary": "#009e60" },
    "formation": "4-3-3",
    "source": "https://www.fcratings.com/nations/ivory-coast-28",
    "tacticalProfile": {
      "style": "Attacking / Physical",
      "formation": "4-3-3",
      "playerRoles": {
        "playmaker": "ci-kessie",
        "targetMan": "ci-haller"
      }
    },
    "players": [
      { "id": "ci-fofana_gk", "realName": "Yahia Fofana", "displayName": "Fofana", "nationality": "Côte d'Ivoire", "club": "Angers", "position": "GK", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 72, 68, 78, 45, 74], "traits": [] },
      { "id": "ci-ndicka", "realName": "Evan Ndicka", "displayName": "Ndicka", "nationality": "Côte d'Ivoire", "club": "Roma", "position": "CB", "overall": 80, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [75, 45, 65, 68, 80, 82], "traits": [] },
      { "id": "ci-kossounou", "realName": "Odilon Kossounou", "displayName": "Kossounou", "nationality": "Côte d'Ivoire", "club": "Bayer Leverkusen", "position": "CB", "overall": 81, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 45, 68, 72, 80, 82], "traits": [] },
      { "id": "ci-konan", "realName": "Ghislain Konan", "displayName": "Konan", "nationality": "Côte d'Ivoire", "club": "Al Fayha", "position": "LB", "overall": 76, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [84, 55, 70, 74, 72, 70], "traits": [] },
      { "id": "ci-singo", "realName": "Wilfried Singo", "displayName": "Singo", "nationality": "Côte d'Ivoire", "club": "Monaco", "position": "RB", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 60, 68, 75, 76, 80], "traits": [] },
      { "id": "ci-kessie", "realName": "Franck Kessié", "displayName": "Kessié", "nationality": "Côte d'Ivoire", "club": "Al Ahli", "position": "CM", "overall": 82, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 76, 78, 78, 76, 86], "traits": [] },
      { "id": "ci-sangare", "realName": "Ibrahim Sangaré", "displayName": "Sangaré", "nationality": "Côte d'Ivoire", "club": "Nott'm Forest", "position": "CDM", "overall": 79, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 65, 74, 75, 78, 84], "traits": [] },
      { "id": "ci-fofana", "realName": "Seko Fofana", "displayName": "Fofana", "nationality": "Côte d'Ivoire", "club": "Al Nassr", "position": "CM", "overall": 81, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 80, 78, 82, 70, 82], "traits": [] },
      { "id": "ci-pepe", "realName": "Nicolas Pépé", "displayName": "Pépé", "nationality": "Côte d'Ivoire", "club": "Trabzonspor", "position": "RW", "overall": 77, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [86, 76, 74, 80, 35, 62], "traits": [] },
      { "id": "ci-haller", "realName": "Sébastien Haller", "displayName": "Haller", "nationality": "Côte d'Ivoire", "club": "Dortmund", "position": "ST", "overall": 81, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 82, 72, 76, 45, 84], "traits": [] },
      { "id": "ci-adingra", "realName": "Simon Adingra", "displayName": "Adingra", "nationality": "Côte d'Ivoire", "club": "Brighton", "position": "LW", "overall": 79, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [88, 74, 74, 82, 40, 60], "traits": [] },
      { "id": "ci-krasso", "realName": "Jean-Philippe Krasso", "displayName": "Krasso", "nationality": "Côte d'Ivoire", "club": "Red Star FC", "position": "ST", "overall": 75, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [75, 75, 70, 76, 40, 74], "traits": [] },
      { "id": "ci-boga", "realName": "Jérémie Boga", "displayName": "Boga", "nationality": "Côte d'Ivoire", "club": "Nice", "position": "LW", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [85, 72, 75, 84, 35, 55], "traits": [] },
      { "id": "ci-diakite", "realName": "Oumar Diakité", "displayName": "Diakité", "nationality": "Côte d'Ivoire", "club": "Reims", "position": "ST", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 70, 65, 74, 35, 72], "traits": [] },
      { "id": "ci-seri", "realName": "Jean Michaël Seri", "displayName": "Seri", "nationality": "Côte d'Ivoire", "club": "Hull City", "position": "CM", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 68, 78, 76, 65, 62], "traits": [] },
      { "id": "ci-bamba", "realName": "Jonathan Bamba", "displayName": "Bamba", "nationality": "Côte d'Ivoire", "club": "Celta Vigo", "position": "LM", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 74, 74, 80, 45, 60], "traits": [] }
    ]
  },
  "southafrica": {
    "nation": "South Africa", "displayName": "África do Sul",
    "colors": { "primary": "#007749", "secondary": "#ffb81c" },
    "formation": "4-2-3-1",
    "source": "https://www.fcratings.com/nations/south-africa-42",
    "tacticalProfile": {
      "style": "Balanced / Counter",
      "formation": "4-2-3-1",
      "playerRoles": {
        "playmaker": "za-tau",
        "targetMan": "za-foster"
      }
    },
    "players": [
      { "id": "za-williams", "realName": "Ronwen Williams", "displayName": "Williams", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "GK", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 74, 78, 78, 50, 75], "traits": [] },
      { "id": "za-mvala", "realName": "Mothobi Mvala", "displayName": "Mvala", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "CB", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 50, 62, 60, 72, 80], "traits": [] },
      { "id": "za-kekana", "realName": "Grant Kekana", "displayName": "Kekana", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "CB", "overall": 71, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 45, 60, 62, 70, 75], "traits": [] },
      { "id": "za-mudau", "realName": "Khuliso Mudau", "displayName": "Mudau", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "RB", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 55, 65, 70, 68, 72], "traits": [] },
      { "id": "za-modiba", "realName": "Aubrey Modiba", "displayName": "Modiba", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "LB", "overall": 71, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [78, 60, 68, 72, 65, 66], "traits": [] },
      { "id": "za-mokoena", "realName": "Teboho Mokoena", "displayName": "Mokoena", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "CDM", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 72, 75, 74, 70, 76], "traits": [] },
      { "id": "za-sithole", "realName": "Sphephelo Sithole", "displayName": "Sithole", "nationality": "South Africa", "club": "Tondela", "position": "CM", "overall": 70, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 60, 68, 70, 68, 74], "traits": [] },
      { "id": "za-zwane", "realName": "Themba Zwane", "displayName": "Zwane", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "CAM", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 70, 75, 76, 45, 60], "traits": [] },
      { "id": "za-tau", "realName": "Percy Tau", "displayName": "Tau", "nationality": "South Africa", "club": "Al Ahly", "position": "RW", "overall": 76, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [86, 74, 72, 78, 40, 62], "traits": [] },
      { "id": "za-foster", "realName": "Lyle Foster", "displayName": "Foster", "nationality": "South Africa", "club": "Burnley", "position": "ST", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 74, 65, 72, 35, 75], "traits": [] },
      { "id": "za-makgopa", "realName": "Evidence Makgopa", "displayName": "Makgopa", "nationality": "South Africa", "club": "Orlando Pirates", "position": "ST", "overall": 69, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 68, 58, 65, 30, 76], "traits": [] },
      { "id": "za-lepasa", "realName": "Zakhele Lepasa", "displayName": "Lepasa", "nationality": "South Africa", "club": "Orlando Pirates", "position": "ST", "overall": 68, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [80, 68, 60, 68, 30, 65], "traits": [] },
      { "id": "za-morena", "realName": "Thapelo Morena", "displayName": "Morena", "nationality": "South Africa", "club": "Mamelodi Sundowns", "position": "RM", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [88, 65, 68, 72, 60, 65], "traits": [] },
      { "id": "za-xulu", "realName": "Siyanda Xulu", "displayName": "Xulu", "nationality": "South Africa", "club": "SuperSport United", "position": "CB", "overall": 70, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [60, 40, 55, 58, 70, 74], "traits": [] },
      { "id": "za-mobbie", "realName": "Nyiko Mobbie", "displayName": "Mobbie", "nationality": "South Africa", "club": "Sekhukhune United", "position": "RB", "overall": 69, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 50, 62, 66, 65, 68], "traits": [] },
      { "id": "za-goss", "realName": "Ricardo Goss", "displayName": "Goss", "nationality": "South Africa", "club": "SuperSport United", "position": "GK", "overall": 68, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 65, 65, 72, 40, 68], "traits": [] }
    ]
  },
  "ghana": {
    "nation": "Ghana", "displayName": "Gana",
    "colors": { "primary": "#ce1126", "secondary": "#fcd116" },
    "formation": "4-2-3-1",
    "source": "https://www.fcratings.com/nations/ghana-31",
    "tacticalProfile": {
      "style": "Athletic / Counter",
      "formation": "4-2-3-1",
      "playerRoles": {
        "playmaker": "gh-kudus",
        "targetMan": "gh-williams"
      }
    },
    "players": [
      { "id": "gh-atizigi", "realName": "Lawrence Ati-Zigi", "displayName": "Ati-Zigi", "nationality": "Ghana", "club": "St. Gallen", "position": "GK", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [75, 70, 68, 76, 45, 72], "traits": [] },
      { "id": "gh-djiku", "realName": "Alexander Djiku", "displayName": "Djiku", "nationality": "Ghana", "club": "Fenerbahce", "position": "CB", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 45, 65, 68, 76, 78], "traits": [] },
      { "id": "gh-salisu", "realName": "Mohammed Salisu", "displayName": "Salisu", "nationality": "Ghana", "club": "Monaco", "position": "CB", "overall": 78, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [68, 40, 60, 62, 78, 80], "traits": [] },
      { "id": "gh-mensah", "realName": "Gideon Mensah", "displayName": "Mensah", "nationality": "Ghana", "club": "Auxerre", "position": "LB", "overall": 73, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [84, 55, 68, 72, 68, 70], "traits": [] },
      { "id": "gh-seidu", "realName": "Alidu Seidu", "displayName": "Seidu", "nationality": "Ghana", "club": "Rennes", "position": "RB", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 50, 66, 72, 74, 76], "traits": [] },
      { "id": "gh-partey", "realName": "Thomas Partey", "displayName": "Partey", "nationality": "Ghana", "club": "Arsenal", "position": "CDM", "overall": 82, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 74, 80, 80, 78, 82], "traits": [] },
      { "id": "gh-kudus", "realName": "Mohammed Kudus", "displayName": "Kudus", "nationality": "Ghana", "club": "West Ham", "position": "CAM", "alternatePositions": ["RW"], "overall": 83, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [86, 80, 78, 86, 55, 78], "traits": [] },
      { "id": "gh-samed", "realName": "Salis Abdul Samed", "displayName": "Samed", "nationality": "Ghana", "club": "Lens", "position": "CDM", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 60, 72, 74, 74, 76], "traits": [] },
      { "id": "gh-jayew", "realName": "Jordan Ayew", "displayName": "J. Ayew", "nationality": "Ghana", "club": "Crystal Palace", "position": "LW", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 74, 74, 78, 50, 74], "traits": [] },
      { "id": "gh-williams", "realName": "Iñaki Williams", "displayName": "Williams", "nationality": "Ghana", "club": "Athletic Club", "position": "ST", "alternatePositions": ["RW"], "overall": 82, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [92, 80, 74, 80, 45, 80], "traits": [] },
      { "id": "gh-semenyo", "realName": "Antoine Semenyo", "displayName": "Semenyo", "nationality": "Ghana", "club": "Bournemouth", "position": "ST", "alternatePositions": ["RW"], "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 76, 70, 78, 40, 76], "traits": [] },
      { "id": "gh-nuamah", "realName": "Ernest Nuamah", "displayName": "Nuamah", "nationality": "Ghana", "club": "Lyon", "position": "RW", "overall": 76, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [88, 72, 68, 78, 35, 62], "traits": [] },
      { "id": "gh-paintsil", "realName": "Joseph Paintsil", "displayName": "Paintsil", "nationality": "Ghana", "club": "LA Galaxy", "position": "RM", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [92, 74, 72, 78, 40, 65], "traits": [] },
      { "id": "gh-amartey", "realName": "Daniel Amartey", "displayName": "Amartey", "nationality": "Ghana", "club": "Besiktas", "position": "CB", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 50, 62, 64, 74, 76], "traits": [] },
      { "id": "gh-baba", "realName": "Baba Rahman", "displayName": "Baba", "nationality": "Ghana", "club": "PAOK", "position": "LB", "overall": 72, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [78, 55, 68, 70, 68, 68], "traits": [] },
      { "id": "gh-lamptey", "realName": "Tariq Lamptey", "displayName": "Lamptey", "nationality": "Ghana", "club": "Brighton", "position": "RB", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [90, 50, 68, 76, 68, 55], "traits": [] }
    ]
  },
  "algeria": {
    "nation": "Algeria", "displayName": "Argélia",
    "colors": { "primary": "#006233", "secondary": "#ffffff" },
    "formation": "4-3-3",
    "source": "https://www.fcratings.com/nations/algeria-22",
    "tacticalProfile": {
      "style": "Attacking / Wide",
      "formation": "4-3-3",
      "playerRoles": {
        "playmaker": "dz-mahrez",
        "targetMan": "dz-bounedjah"
      }
    },
    "players": [
      { "id": "dz-mandrea", "realName": "Anthony Mandréa", "displayName": "Mandréa", "nationality": "Algeria", "club": "Caen", "position": "GK", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 70, 68, 75, 40, 72], "traits": [] },
      { "id": "dz-bensebaini", "realName": "Ramy Bensebaini", "displayName": "Bensebaini", "nationality": "Algeria", "club": "Dortmund", "position": "CB", "alternatePositions": ["LB"], "overall": 80, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [74, 68, 74, 75, 78, 80], "traits": [] },
      { "id": "dz-mandi", "realName": "Aïssa Mandi", "displayName": "Mandi", "nationality": "Algeria", "club": "Villarreal", "position": "CB", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 45, 68, 68, 78, 74], "traits": [] },
      { "id": "dz-aitnouri", "realName": "Rayan Aït-Nouri", "displayName": "Aït-Nouri", "nationality": "Algeria", "club": "Wolves", "position": "LB", "overall": 80, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [82, 60, 75, 82, 74, 68], "traits": [] },
      { "id": "dz-atal", "realName": "Youcef Atal", "displayName": "Atal", "nationality": "Algeria", "club": "Adana Demirspor", "position": "RB", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [88, 68, 72, 80, 70, 65], "traits": [] },
      { "id": "dz-bennacer", "realName": "Ismaël Bennacer", "displayName": "Bennacer", "nationality": "Algeria", "club": "Milan", "position": "CM", "alternatePositions": ["CDM"], "overall": 83, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [76, 70, 82, 85, 76, 74], "traits": [] },
      { "id": "dz-bentaleb", "realName": "Nabil Bentaleb", "displayName": "Bentaleb", "nationality": "Algeria", "club": "Lille", "position": "CDM", "overall": 78, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [65, 70, 78, 76, 74, 76], "traits": [] },
      { "id": "dz-aouar", "realName": "Houssem Aouar", "displayName": "Aouar", "nationality": "Algeria", "club": "Roma", "position": "CAM", "alternatePositions": ["CM"], "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 74, 80, 82, 55, 60], "traits": [] },
      { "id": "dz-mahrez", "realName": "Riyad Mahrez", "displayName": "Mahrez", "nationality": "Algeria", "club": "Al Ahli", "position": "RW", "overall": 85, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [78, 80, 84, 88, 38, 58], "traits": ["DRIBBLER", "LEFT_FOOTED_CREATOR"] },
      { "id": "dz-benrahma", "realName": "Saïd Benrahma", "displayName": "Benrahma", "nationality": "Algeria", "club": "Lyon", "position": "LW", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [80, 76, 76, 84, 40, 60], "traits": [] },
      { "id": "dz-bounedjah", "realName": "Baghdad Bounedjah", "displayName": "Bounedjah", "nationality": "Algeria", "club": "Al Sadd", "position": "ST", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [75, 78, 68, 75, 35, 76], "traits": [] },
      { "id": "dz-gouiri", "realName": "Amine Gouiri", "displayName": "Gouiri", "nationality": "Algeria", "club": "Rennes", "position": "ST", "alternatePositions": ["LW"], "overall": 80, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 80, 76, 82, 40, 68], "traits": [] },
      { "id": "dz-slimani", "realName": "Islam Slimani", "displayName": "Slimani", "nationality": "Algeria", "club": "Mechelen", "position": "ST", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [60, 75, 64, 70, 45, 78], "traits": [] },
      { "id": "dz-feghouli", "realName": "Sofiane Feghouli", "displayName": "Feghouli", "nationality": "Algeria", "club": "Karagumruk", "position": "CM", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 70, 76, 78, 60, 65], "traits": [] },
      { "id": "dz-touba", "realName": "Ahmed Touba", "displayName": "Touba", "nationality": "Algeria", "club": "Lecce", "position": "CB", "overall": 73, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [65, 45, 60, 64, 72, 76], "traits": [] },
      { "id": "dz-oukidja", "realName": "Alexandre Oukidja", "displayName": "Oukidja", "nationality": "Algeria", "club": "Metz", "position": "GK", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [75, 70, 70, 76, 40, 74], "traits": [] }
    ]
  },
  "tunisia": {
    "nation": "Tunisia", "displayName": "Tunísia",
    "colors": { "primary": "#e70013", "secondary": "#ffffff" },
    "formation": "4-3-3",
    "source": "https://www.fcratings.com/nations/tunisia-44",
    "tacticalProfile": {
      "style": "Defensive / Counter",
      "formation": "4-3-3",
      "playerRoles": {
        "playmaker": "tn-msakni",
        "targetMan": "tn-jaziri"
      }
    },
    "players": [
      { "id": "tn-dahmen", "realName": "Aymen Dahmen", "displayName": "Dahmen", "nationality": "Tunisia", "club": "Al Hazem", "position": "GK", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 68, 65, 75, 40, 70], "traits": [] },
      { "id": "tn-talbi", "realName": "Montassar Talbi", "displayName": "Talbi", "nationality": "Tunisia", "club": "Lorient", "position": "CB", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 40, 58, 62, 76, 78], "traits": [] },
      { "id": "tn-meriah", "realName": "Yassine Meriah", "displayName": "Meriah", "nationality": "Tunisia", "club": "Esperance", "position": "CB", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 45, 60, 64, 72, 76], "traits": [] },
      { "id": "tn-maaloul", "realName": "Ali Maâloul", "displayName": "Maâloul", "nationality": "Tunisia", "club": "Al Ahly", "position": "LB", "overall": 75, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [76, 65, 76, 76, 70, 68], "traits": [] },
      { "id": "tn-kechrida", "realName": "Wajdi Kechrida", "displayName": "Kechrida", "nationality": "Tunisia", "club": "Atromitos", "position": "RB", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 55, 68, 72, 68, 70], "traits": [] },
      { "id": "tn-skhiri", "realName": "Ellyes Skhiri", "displayName": "Skhiri", "nationality": "Tunisia", "club": "Eintracht Frankfurt", "position": "CDM", "overall": 80, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 68, 76, 76, 80, 82], "traits": [] },
      { "id": "tn-laidouni", "realName": "Aïssa Laïdouni", "displayName": "Laïdouni", "nationality": "Tunisia", "club": "Union Berlin", "position": "CM", "overall": 77, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 65, 74, 75, 74, 80], "traits": [] },
      { "id": "tn-benromdhane", "realName": "Mohamed Ali Ben Romdhane", "displayName": "Ben Romdhane", "nationality": "Tunisia", "club": "Ferencvaros", "position": "CM", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 70, 74, 76, 65, 72], "traits": [] },
      { "id": "tn-msakni", "realName": "Youssef Msakni", "displayName": "Msakni", "nationality": "Tunisia", "club": "Al Arabi", "position": "LW", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 75, 75, 80, 40, 65], "traits": [] },
      { "id": "tn-achouri", "realName": "Elias Achouri", "displayName": "Achouri", "nationality": "Tunisia", "club": "FC Copenhagen", "position": "LW", "alternatePositions": ["RW"], "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 72, 72, 80, 40, 60], "traits": [] },
      { "id": "tn-jaziri", "realName": "Seifeddine Jaziri", "displayName": "Jaziri", "nationality": "Tunisia", "club": "Zamalek", "position": "ST", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 72, 62, 70, 35, 74], "traits": [] },
      { "id": "tn-rafia", "realName": "Hamza Rafia", "displayName": "Rafia", "nationality": "Tunisia", "club": "Lecce", "position": "CAM", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 68, 72, 75, 50, 65], "traits": [] },
      { "id": "tn-sliti", "realName": "Naïm Sliti", "displayName": "Sliti", "nationality": "Tunisia", "club": "Al Ahli Doha", "position": "RW", "overall": 75, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 72, 75, 82, 35, 60], "traits": [] },
      { "id": "tn-valery", "realName": "Yan Valery", "displayName": "Valery", "nationality": "Tunisia", "club": "Angers", "position": "RB", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 55, 65, 70, 70, 74], "traits": [] },
      { "id": "tn-ghandri", "realName": "Nader Ghandri", "displayName": "Ghandri", "nationality": "Tunisia", "club": "Akhmat Grozny", "position": "CB", "overall": 71, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [60, 45, 60, 62, 70, 78], "traits": [] },
      { "id": "tn-bensaid", "realName": "Bechir Ben Said", "displayName": "Ben Said", "nationality": "Tunisia", "club": "US Monastir", "position": "GK", "overall": 70, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 68, 65, 74, 40, 68], "traits": [] }
    ]
  },
  "drcongo": {
    "nation": "Congo DR", "displayName": "RD Congo",
    "colors": { "primary": "#007fff", "secondary": "#ce1126" },
    "formation": "4-2-3-1",
    "source": "https://www.fcratings.com/nations/dr-congo-29",
    "tacticalProfile": {
      "style": "Physical / Direct",
      "formation": "4-2-3-1",
      "playerRoles": {
        "playmaker": "cd-kakuta",
        "targetMan": "cd-bakambu"
      }
    },
    "players": [
      { "id": "cd-mpasi", "realName": "Lionel Mpasi", "displayName": "Mpasi", "nationality": "Congo DR", "club": "Rodez", "position": "GK", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 68, 65, 75, 40, 72], "traits": [] },
      { "id": "cd-mbemba", "realName": "Chancel Mbemba", "displayName": "Mbemba", "nationality": "Congo DR", "club": "Marseille", "position": "CB", "overall": 80, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 55, 68, 70, 80, 82], "traits": [] },
      { "id": "cd-inonga", "realName": "Henoc Inonga", "displayName": "Inonga", "nationality": "Congo DR", "club": "Simba", "position": "CB", "overall": 70, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 40, 55, 60, 70, 75], "traits": [] },
      { "id": "cd-masuaku", "realName": "Arthur Masuaku", "displayName": "Masuaku", "nationality": "Congo DR", "club": "Besiktas", "position": "LB", "overall": 76, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [82, 65, 74, 78, 70, 72], "traits": [] },
      { "id": "cd-kalulu", "realName": "Gédéon Kalulu", "displayName": "Kalulu", "nationality": "Congo DR", "club": "Lorient", "position": "RB", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [80, 55, 68, 72, 70, 74], "traits": [] },
      { "id": "cd-moutoussamy", "realName": "Samuel Moutoussamy", "displayName": "Moutoussamy", "nationality": "Congo DR", "club": "Nantes", "position": "CM", "overall": 74, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [74, 65, 72, 74, 70, 76], "traits": [] },
      { "id": "cd-pickel", "realName": "Charles Pickel", "displayName": "Pickel", "nationality": "Congo DR", "club": "Cremonese", "position": "CDM", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 60, 68, 72, 72, 78], "traits": [] },
      { "id": "cd-kakuta", "realName": "Gaël Kakuta", "displayName": "Kakuta", "nationality": "Congo DR", "club": "Amiens", "position": "CAM", "overall": 73, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [70, 72, 75, 78, 45, 60], "traits": [] },
      { "id": "cd-wissa", "realName": "Yoane Wissa", "displayName": "Wissa", "nationality": "Congo DR", "club": "Brentford", "position": "LW", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 78, 72, 80, 45, 68], "traits": [] },
      { "id": "cd-elia", "realName": "Meschack Elia", "displayName": "Elia", "nationality": "Congo DR", "club": "Young Boys", "position": "RW", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [90, 72, 70, 78, 40, 65], "traits": [] },
      { "id": "cd-bakambu", "realName": "Cédric Bakambu", "displayName": "Bakambu", "nationality": "Congo DR", "club": "Real Betis", "position": "ST", "overall": 76, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [82, 76, 68, 76, 40, 74], "traits": [] },
      { "id": "cd-banza", "realName": "Simon Banza", "displayName": "Banza", "nationality": "Congo DR", "club": "Braga", "position": "ST", "overall": 78, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 80, 65, 75, 45, 82], "traits": [] },
      { "id": "cd-mayele", "realName": "Fiston Mayele", "displayName": "Mayele", "nationality": "Congo DR", "club": "Pyramids", "position": "ST", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 74, 60, 70, 35, 75], "traits": [] },
      { "id": "cd-bongonda", "realName": "Théo Bongonda", "displayName": "Bongonda", "nationality": "Congo DR", "club": "Spartak Moscow", "position": "RW", "overall": 76, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [86, 72, 72, 80, 40, 60], "traits": [] },
      { "id": "cd-batubinsika", "realName": "Dylan Batubinsika", "displayName": "Batubinsika", "nationality": "Congo DR", "club": "St-Etienne", "position": "CB", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 40, 58, 62, 72, 78], "traits": [] },
      { "id": "cd-bertaud", "realName": "Dimitry Bertaud", "displayName": "Bertaud", "nationality": "Congo DR", "club": "Montpellier", "position": "GK", "overall": 71, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 68, 66, 74, 45, 70], "traits": [] }
    ]
  },
  "caboverde": {
    "nation": "Cabo Verde", "displayName": "Cabo Verde",
    "colors": { "primary": "#003893", "secondary": "#cf2027" },
    "formation": "4-3-3",
    "source": "https://www.fcratings.com/nations/cape-verde-45",
    "tacticalProfile": {
      "style": "Balanced / Wide",
      "formation": "4-3-3",
      "playerRoles": {
        "playmaker": "cv-mendes",
        "targetMan": "cv-bebe"
      }
    },
    "players": [
      { "id": "cv-vozinha", "realName": "Vozinha", "displayName": "Vozinha", "nationality": "Cabo Verde", "club": "AS Trencin", "position": "GK", "overall": 68, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 65, 62, 72, 40, 68], "traits": [] },
      { "id": "cv-costa", "realName": "Logan Costa", "displayName": "Costa", "nationality": "Cabo Verde", "club": "Toulouse", "position": "CB", "overall": 74, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 45, 60, 64, 74, 78], "traits": [] },
      { "id": "cv-lopes", "realName": "Roberto Lopes", "displayName": "Lopes", "nationality": "Cabo Verde", "club": "Shamrock Rovers", "position": "CB", "overall": 68, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 40, 55, 58, 68, 74], "traits": [] },
      { "id": "cv-joaopaulo", "realName": "João Paulo", "displayName": "João Paulo", "nationality": "Cabo Verde", "club": "Sheriff Tiraspol", "position": "LB", "overall": 69, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [78, 55, 65, 70, 65, 68], "traits": [] },
      { "id": "cv-moreira", "realName": "Steven Moreira", "displayName": "Moreira", "nationality": "Cabo Verde", "club": "Columbus Crew", "position": "RB", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [80, 55, 68, 72, 68, 72], "traits": [] },
      { "id": "cv-pina", "realName": "Kevin Pina", "displayName": "Pina", "nationality": "Cabo Verde", "club": "FC Krasnodar", "position": "CDM", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [70, 60, 68, 70, 70, 76], "traits": [] },
      { "id": "cv-andrade", "realName": "Patrick Andrade", "displayName": "Andrade", "nationality": "Cabo Verde", "club": "Qarabag", "position": "CM", "overall": 71, "preferredFoot": "Left", "source": "EA_FC_26_ESTIMATED", "stats": [72, 65, 70, 72, 66, 70], "traits": [] },
      { "id": "cv-monteiro", "realName": "Jamiro Monteiro", "displayName": "Monteiro", "nationality": "Cabo Verde", "club": "Gaziantep", "position": "CM", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [74, 68, 74, 76, 60, 65], "traits": [] },
      { "id": "cv-mendes", "realName": "Ryan Mendes", "displayName": "Mendes", "nationality": "Cabo Verde", "club": "Karagumruk", "position": "LW", "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [80, 72, 70, 76, 40, 60], "traits": [] },
      { "id": "cv-bebe", "realName": "Bebé", "displayName": "Bebé", "nationality": "Cabo Verde", "club": "Rayo Vallecano", "position": "ST", "alternatePositions": ["LW"], "overall": 72, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [76, 76, 68, 74, 45, 75], "traits": [] },
      { "id": "cv-cabral", "realName": "Jovane Cabral", "displayName": "Cabral", "nationality": "Cabo Verde", "club": "Olympiacos", "position": "RW", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [84, 72, 70, 78, 40, 65], "traits": [] },
      { "id": "cv-jovane", "realName": "Garry Rodrigues", "displayName": "Rodrigues", "nationality": "Cabo Verde", "club": "Ankaragucu", "position": "LW", "overall": 73, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [86, 72, 70, 76, 35, 62], "traits": [] },
      { "id": "cv-duarte", "realName": "Deroy Duarte", "displayName": "Duarte", "nationality": "Cabo Verde", "club": "Fortuna Sittard", "position": "CM", "overall": 70, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [72, 65, 70, 72, 64, 68], "traits": [] },
      { "id": "cv-borges", "realName": "Diney Borges", "displayName": "Borges", "nationality": "Cabo Verde", "club": "Al Bataeh", "position": "CB", "overall": 68, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [65, 40, 55, 58, 68, 74], "traits": [] },
      { "id": "cv-silva", "realName": "Márcio da Rosa", "displayName": "Márcio", "nationality": "Cabo Verde", "club": "Vilafranquense", "position": "GK", "overall": 65, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [68, 62, 60, 70, 35, 65], "traits": [] },
      { "id": "cv-rodrigues", "realName": "Gilson Tavares", "displayName": "Gilson", "nationality": "Cabo Verde", "club": "Benfica B", "position": "ST", "overall": 66, "preferredFoot": "Right", "source": "EA_FC_26_ESTIMATED", "stats": [78, 66, 58, 68, 30, 68], "traits": [] }
    ]
  }
};

const basePath = 'C:\\Users\\dedsf\\futsim\\data\\ea-fc-26';
fs.mkdirSync(basePath, { recursive: true });

fs.writeFileSync(path.join(basePath, 'squads-africa.json'), JSON.stringify(squads, null, 2), 'utf-8');

const meta = {
  "region": "Africa",
  "generatedAt": new Date().toISOString(),
  "source": "EA_FC_26_ESTIMATED",
  "nations": Object.keys(squads).map(k => ({
    "id": k,
    "name": squads[k].nation,
    "displayName": squads[k].displayName
  }))
};

fs.writeFileSync(path.join(basePath, 'generated-africa-meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
console.log('Successfully wrote files');
