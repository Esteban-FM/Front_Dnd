export const ABILITIES = {
  artificer: [
    { id: "infuse", name: "Infundir Objeto", desc: "Infunde magia en un objeto no mágico.", damage: null },
    { id: "arcane_cannon", name: "Cañón Arcano", desc: "Invoca un cañón que dispara energía.", damage: "2d8" },
    { id: "flash_of_genius", name: "Flash de Genialidad", desc: "Añade tu INT a una tirada aliada.", damage: null },
  ],
  barbarian: [
    { id: "rage", name: "Furia", desc: "+2 daño, resistencia a daño físico por 1 minuto.", damage: null },
    { id: "reckless", name: "Ataque Temerario", desc: "Ventaja en ataques, enemigos tienen ventaja contra ti.", damage: "2d6" },
    { id: "brutal_critical", name: "Crítico Brutal", desc: "Un dado extra en golpes críticos.", damage: "1d12" },
  ],
  bard: [
    { id: "bardic", name: "Inspiración Bárdica", desc: "Da 1d6 extra a una tirada aliada.", damage: null },
    { id: "vicious_mockery", name: "Burla Viciosa", desc: "Daño psíquico y desventaja al enemigo.", damage: "1d4" },
    { id: "cutting_words", name: "Palabras Cortantes", desc: "Resta 1d6 a una tirada enemiga.", damage: null },
  ],
  warlock: [
    { id: "eldritch_blast", name: "Explosión Sobrenatural", desc: "Rayo de energía cósmica.", damage: "1d10" },
    { id: "hex", name: "Maldición", desc: "Maldice a un enemigo, +1d6 daño necrótico.", damage: "1d6" },
    { id: "darkness", name: "Oscuridad", desc: "Crea una esfera de oscuridad mágica.", damage: null },
  ],
  cleric: [
    { id: "sacred_flame", name: "Llama Sagrada", desc: "Llama radiante cae sobre el enemigo.", damage: "1d8" },
    { id: "cure_wounds", name: "Curar Heridas", desc: "Restaura HP a un aliado.", damage: null },
    { id: "turn_undead", name: "Expulsar No-Muertos", desc: "Los no-muertos huyen aterrorizados.", damage: null },
  ],
  druid: [
    { id: "shillelagh", name: "Shillelagh", desc: "Tu bastón usa WIS para atacar.", damage: "1d8" },
    { id: "wild_shape", name: "Forma Salvaje", desc: "Te transformas en un animal.", damage: null },
    { id: "entangle", name: "Enredar", desc: "Plantas enredan a enemigos en área.", damage: null },
  ],
  ranger: [
    { id: "hunters_mark", name: "Marca del Cazador", desc: "+1d6 daño al objetivo marcado.", damage: "1d6" },
    { id: "multiattack", name: "Ataque Múltiple", desc: "Realizas dos ataques en un turno.", damage: "2d6" },
    { id: "colossus_slayer", name: "Mata Colosos", desc: "+1d8 daño a enemigos heridos.", damage: "1d8" },
  ],
  fighter: [
    { id: "action_surge", name: "Oleada de Acción", desc: "Realiza una acción extra este turno.", damage: null },
    { id: "second_wind", name: "Segundo Aliento", desc: "Recuperas 1d10 + nivel de HP.", damage: null },
    { id: "cleave", name: "Tajo", desc: "Ataque que golpea a varios enemigos.", damage: "2d8" },
  ],
  sorcerer: [
    { id: "fire_bolt", name: "Dardo de Fuego", desc: "Proyectil de fuego al objetivo.", damage: "1d10" },
    { id: "metamagic", name: "Metamagia", desc: "Modifica tus hechizos con puntos de hechicería.", damage: null },
    { id: "chaos_bolt", name: "Rayo del Caos", desc: "Daño de tipo aleatorio.", damage: "2d8" },
  ],
  monk: [
    { id: "flurry", name: "Lluvia de Golpes", desc: "Dos ataques extra con manos desnudas.", damage: "1d6" },
    { id: "stunning_strike", name: "Golpe Aturdidor", desc: "El enemigo queda aturdido hasta tu próximo turno.", damage: null },
    { id: "ki_blast", name: "Onda Ki", desc: "Liberas energía Ki como proyectil.", damage: "2d6" },
  ],
  paladin: [
    { id: "divine_smite", name: "Castigo Divino", desc: "Gasta un espacio de hechizo para daño extra.", damage: "2d8" },
    { id: "lay_on_hands", name: "Imposición de Manos", desc: "Restaura HP con tu reserva de curación.", damage: null },
    { id: "aura_protection", name: "Aura de Protección", desc: "+CHA a tiradas de salvación aliadas.", damage: null },
  ],
  rogue: [
    { id: "sneak_attack", name: "Ataque Furtivo", desc: "Daño extra si tienes ventaja o aliado adyacente.", damage: "2d6" },
    { id: "cunning_action", name: "Acción Astuta", desc: "Bonus de acción: Correr, Esconderse o Alejarse.", damage: null },
    { id: "evasion", name: "Evasión", desc: "Evitas completamente efectos de área con DEX.", damage: null },
  ],
};