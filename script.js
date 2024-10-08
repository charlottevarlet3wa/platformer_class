const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const messageBox = document.getElementById("messageBox");
const errElem = document.getElementById("error");

const GRAVITY = 0.3;
const JUMP_POWER = -8;
const PLAYER_SPEED = 2;

let collectedCoins = 0;
let playerLives = 3;

let keys = {};
let isMKeyDown = false; // Flag to track the state of 'm' key
let jumpKeyPressed = false;

// const types = ["Right", "Up"];
const types = ["Right"];
let currentTypeIndex = 0;

// Création du joueur et chargement du niveau
const platforms = [];
const coins = [];
const enemies = [];
const doors = [];
const walls = [];
const spikes = [];

let currentLevel = 0;

document.addEventListener("keyup", (event) => {
  if (event.code === "KeyP") {
    currentTypeIndex = (currentTypeIndex + 1) % types.length;
    player.changePlatformType(player.platformMessage, types[currentTypeIndex]);
    return;
  }
  keys[event.code] = false;

  if (event.code === "KeyW") {
    jumpKeyPressed = false;
  }
});

document.addEventListener("keyup", (event) => {
  if (isInputActive()) {
    return;
  }
  if (event.code === "KeyM") {
    // Arrêter l'action continue lorsque 'm' est relâchée
    isMKeyDown = false;
  }
  if (event.code === "KeyN") {
    // Arrêter l'action continue lorsque 'm' est relâchée
    resetLevel();
  }
});

function continueMKeyAction() {
  if (isMKeyDown) {
    // Action continue tant que 'm' est enfoncée
    if (player.nearPlatform && player.platformMessage) {
      player.platformMessage.action(player); // Exemple : déplacer la plateforme
    }
    // Appel récursif pour continuer l'action dans la prochaine frame
    requestAnimationFrame(continueMKeyAction);
  }
}

document.addEventListener("keydown", (event) => {
  if (isInputActive()) {
    return;
  }

  if (event.code === "KeyP") {
    return;
  }
  keys[event.code] = true;
  if (event.code === "KeyW" && !jumpKeyPressed) {
    jumpKeyPressed = true;
    if (player.onGround) {
      player.velocityY = JUMP_POWER;
      player.onGround = false;
    }
  }

  if (event.code === "KeyL") {
    // Code pour l'action unique à l'appui de 'l'
    if (player.nearPlatform && player.platformMessage) {
      player.platformMessage.action(player); // Exécuter une action unique
    }
  }

  if (event.code === "KeyM" && !isMKeyDown) {
    // Début d'une action continue tant que 'm' est enfoncée
    isMKeyDown = true;
    continueMKeyAction();
  }
});

function displayError(msg) {
  errElem.textContent = msg;
}

document.getElementById("create-class-btn").addEventListener("click", () => {
  const newName = document.getElementById("new-name").value.trim();
  const actionElement = document.getElementById("dynamic-action-content");

  if (!newName) {
    displayError("Please enter a name for the new platform class.");
    return;
  }

  let actionCode = "";
  actionElement.childNodes.forEach((child) => {
    if (child.tagName === "SPAN") {
      // Ignore the delete button and only get the span text or input value
      const textContent = Array.from(child.childNodes)
        .filter((node) => {
          return node.nodeType === Node.TEXT_NODE || node.tagName === "INPUT";
        })
        .map((node) =>
          node.nodeType === Node.TEXT_NODE ? node.textContent : node.value
        )
        .join("");

      actionCode += textContent;
    }
  });

  if (!actionCode.trim()) {
    displayError(
      "The action code cannot be empty. Please provide a valid action."
    );
    return;
  }

  // Construire la classe de plateforme dynamiquement
  const NewPlatformClass = new Function(
    "Platform",
    `return class ${newName} extends Platform {
              constructor(x, y, width, height) {
                  super(x, y, width, height, '${newName}');
              }
  
              action(player) {
                  ${actionCode}
              }
          }`
  )(Platform);

  // Si la classe existe déjà, remplacer la classe existante et mettre à jour l'interface
  if (platformClasses[newName]) {
    // Remplacer la classe existante
    platformClasses[newName] = NewPlatformClass;

    // Mettre à jour l'interface (bouton déjà existant)
    const existingButton = Array.from(
      document.querySelectorAll(".platform-button")
    ).find((button) => button.textContent === newName);

    if (existingButton) {
      existingButton.addEventListener("click", () =>
        selectPlatformType(newName)
      );
    }
  } else {
    // Si la classe n'existe pas encore, ajouter le bouton et la classe
    platformClasses[newName] = NewPlatformClass;
    types.push(newName);

    // Ajouter un bouton pour la nouvelle classe dans le conteneur des boutons
    const buttonContainer = document.getElementById("platform-buttons");
    const newButton = document.createElement("button");
    newButton.className = "platform-button";
    newButton.textContent = newName;
    newButton.addEventListener("click", () => selectPlatformType(newName));
    buttonContainer.appendChild(newButton);
  }
});

function selectPlatformType(typeName) {
  const buttons = document.querySelectorAll(".platform-button");
  buttons.forEach((button) => {
    if (button.textContent === typeName) {
      button.classList.add("active");
      button.style.backgroundColor = "orange";
    } else {
      button.classList.remove("active");
      button.style.backgroundColor = "lightblue";
    }
  });

  if (player.nearPlatform) {
    player.changePlatformType(player.platformMessage, typeName);
  }
}

// CODE 1
const actions = {
  moveRight: function (player) {
    this.x += 1;
    player.x += 1;
  },
  moveLeft: function (player) {
    this.x -= 1;
    player.x -= 1;
  },
  moveUp: function (player) {
    this.y -= 1;
    player.y -= 1;
  },
  moveDown: function (player) {
    this.y += 1;
    player.y += 1;
  },
};

const inputs = document.querySelectorAll(".input-field");

inputs.forEach((input) => {
  input.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  input.addEventListener("drop", (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData("text/plain");
    input.value = data;
  });
});

function createNewPlatformSubclass(name, actionCode) {
  const actionFunction = actions[actionCode];

  if (!actionFunction) {
    displayError("Invalid action selected");
    return;
  }

  const NewPlatformClass = class extends Platform {
    constructor(x, y, width, height) {
      super(x, y, width, height, name);
    }

    action(player) {
      actionFunction.call(this, player);
    }
  };

  platformClasses[name] = NewPlatformClass;
  types.push(name);

  addPlatformButton(name);
  displayError("");
}

function addPlatformButton(name) {
  const platformButtonsDiv = document.getElementById("platform-buttons");

  const button = document.createElement("button");
  button.textContent = name;
  button.classList.add("platform-button");
  button.addEventListener("click", () => {
    if (player.nearPlatform && player.platformMessage) {
      setActiveButton(name);
      player.changePlatformType(player.platformMessage, name); // Utiliser la bonne méthode ici
    }
  });

  platformButtonsDiv.appendChild(button);
}

function createPlatformButtons() {
  const platformButtonsDiv = document.getElementById("platform-buttons");
  platformButtonsDiv.innerHTML = ""; // Clear existing buttons

  types.forEach((type) => {
    addPlatformButton(type);
  });
}

// DRAG AND DROP
const draggableSpans = document.querySelectorAll(".draggable-span");
const actionElement = document.querySelector(".action-element");

draggableSpans.forEach((span) => {
  span.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", span.textContent);
  });
});

actionElement.addEventListener("dragover", (event) => {
  event.preventDefault(); // Necessary to allow a drop
});

actionElement.addEventListener("drop", (event) => {
  event.preventDefault();
  const data = event.dataTransfer.getData("text/plain");

  // Create a new span element
  const newSpan = document.createElement("span");
  newSpan.classList.add("draggable-span");

  if (data === "int") {
    // If the dragged element is "int", replace it with a span containing an input[type=number]
    const input = document.createElement("input");
    input.type = "number";
    input.style.width = "50px";
    newSpan.appendChild(input);
  } else {
    // Otherwise, just set the text
    newSpan.textContent = data;
  }

  // Create the delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "X";
  deleteButton.classList.add("delete-btn");

  // Add an event listener to delete the span on click
  deleteButton.addEventListener("click", () => {
    newSpan.remove();
  });

  newSpan.appendChild(deleteButton);

  // Append the new span to the action-element
  actionElement.appendChild(newSpan);
});

// Classe Player
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.velocityX = 0;
    this.velocityY = 0;
    this.onGround = false;
    this.nearPlatform = false;
    this.platformMessage = null;
  }

  update(platforms, coins, enemies, walls) {
    this.velocityY += GRAVITY;
    this.x += this.velocityX;
    this.y += this.velocityY;

    this.onGround = false;
    this.nearPlatform = false;
    this.platformMessage = null;

    let closestPlatform = null;
    let closestDistance = Infinity;

    for (let platform of platforms) {
      if (
        this.y + this.height > platform.y &&
        this.y + this.height < platform.y + platform.height &&
        this.x + this.width > platform.x &&
        this.x < platform.x + platform.width
      ) {
        this.y = platform.y - this.height;
        this.velocityY = 0;
        this.onGround = true;
      }

      const platformCenterX = platform.x + platform.width / 2;
      const platformCenterY = platform.y + platform.height / 2;
      const playerCenterX = this.x + this.width / 2;
      const playerCenterY = this.y + this.height / 2;

      const distance = Math.hypot(
        playerCenterX - platformCenterX,
        playerCenterY - platformCenterY
      );

      if (
        distance < closestDistance &&
        this.x > platform.x &&
        this.x < platform.x + platform.width &&
        this.y + this.height > platform.y - 100 &&
        this.y < platform.y + platform.height + 100
      ) {
        closestDistance = distance;
        closestPlatform = platform;
      }
    }

    if (closestPlatform) {
      this.nearPlatform = true;
      this.platformMessage = closestPlatform;
      closestPlatform.isDetected = true;

      // Display the code of the platform's subclass in the messageBox
      const platformClassCode =
        platformClasses[closestPlatform.type].toString();
      messageBox.innerHTML = `<pre><code class="language-js">${platformClassCode}</code></pre>`;
      Prism.highlightAll(); // Optional: to highlight the code
    }

    for (let platform of platforms) {
      if (platform !== closestPlatform) {
        platform.isDetected = false;
      }
      platform.update(this);
    }

    for (let wall of walls) {
      wall.update(this); // Mise à jour des murs et vérification des collisions
    }

    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
      this.velocityY = 0;
      this.onGround = true;
    }

    if (keys["KeyA"]) {
      this.velocityX = -PLAYER_SPEED;
    } else if (keys["KeyD"]) {
      this.velocityX = PLAYER_SPEED;
    } else {
      this.velocityX = 0;
    }

    this.collectCoins(coins);
    this.checkEnemyCollisions(enemies);

    this.draw();
  }

  changePlatformType(platform, typeName = null) {
    let newType;
    if (typeName) {
      newType = typeName;
    } else {
      const newTypeIndex = (types.indexOf(platform.type) + 1) % types.length;
      newType = types[newTypeIndex];
    }

    let newPlatformClass = platformClasses[newType];

    if (!newPlatformClass) {
      console.error(`Platform type ${newType} is not defined.`);
      return;
    }

    let newPlatform = new newPlatformClass(
      platform.x,
      platform.y,
      platform.width,
      platform.height
    );

    const index = platforms.indexOf(platform);
    if (index !== -1) {
      platforms[index] = newPlatform;
    }

    // Mettre à jour player.platformMessage pour pointer vers la nouvelle plateforme
    if (this.platformMessage === platform) {
      this.platformMessage = newPlatform;
    }

    console.log(`Platform type changed to: ${newPlatform.type}`);
    setActiveButton(newPlatform.type); // Met à jour le bouton actif
  }

  collectCoins(coins) {
    for (let i = coins.length - 1; i >= 0; i--) {
      let coin = coins[i];
      if (
        this.x < coin.x + coin.radius &&
        this.x + this.width > coin.x - coin.radius &&
        this.y < coin.y + coin.radius &&
        this.y + this.height > coin.y - coin.radius
      ) {
        coins.splice(i, 1);
        collectedCoins++;
      }
    }
  }

  checkEnemyCollisions(enemies) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      let enemy = enemies[i];
      if (
        this.x < enemy.x + enemy.width &&
        this.x + this.width > enemy.x &&
        this.y < enemy.y + enemy.height &&
        this.y + this.height > enemy.y
      ) {
        if (
          this.velocityY > 0 &&
          this.y + this.height - this.velocityY < enemy.y
        ) {
          this.velocityY = JUMP_POWER;
          enemies.splice(i, 1);
        } else {
          playerLives--;
          if (playerLives <= 0) {
            // console.log("Game Over!");
          }
          this.velocityX = this.x < enemy.x ? -PLAYER_SPEED : PLAYER_SPEED;
          this.velocityY = JUMP_POWER / 2;
        }
      }
    }
  }

  draw() {
    ctx.fillStyle = "lightblue";
    drawRoundedRect(ctx, this.x, this.y, this.width, this.height, 10);
  }
}

class Platform {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.isDetected = false;
    this.typeChanged = false;
  }

  update(player) {
    if (this.isPlayerOnPlatform(player) && keys["Semicolon"]) {
      this.action(player);
    }

    if (this.isPlayerOnPlatform(player) && keys["KeyP"] && !this.typeChanged) {
      player.changePlatformType(this);
      this.typeChanged = true;
    }

    if (!keys["KeyP"]) {
      this.typeChanged = false;
    }

    this.draw();
  }

  action(player) {
    // Défini par les sous-classes ou dynamiquement
  }

  draw() {
    ctx.fillStyle = this.isDetected ? "rgb(80,80,80)" : "black";
    drawRoundedRect(ctx, this.x, this.y, this.width, this.height, 10);
  }

  isPlayerOnPlatform(player) {
    return (
      player.y + player.height === this.y &&
      player.x + player.width > this.x &&
      player.x < this.x + this.width
    );
  }
}

class Right extends Platform {
  constructor(x, y, width, height) {
    super(x, y, width, height, "Right");
  }

  action(player) {
    this.x++;
    player.x++;
  }
}

// Sous-classe Up
class Up extends Platform {
  constructor(x, y, width, height) {
    super(x, y, width, height, "Up");
  }

  action(player) {
    this.y--;
    player.y--;
  }
}

// class Spike {
//   constructor(x, y, width, height, direction = "up") {
//     this.x = x;
//     this.y = y;
//     this.width = width;
//     this.height = height;
//     this.direction = direction; // 'up', 'down', 'left', 'right'
//     this.canInflictDamage = true; // To add a delay between damages
//   }

//   update(player) {
//     if (this.checkCollisionWithPlayer(player)) {
//       if (this.canInflictDamage) {
//         playerLives--; // Réduire le nombre de vies du joueur

//         // Appliquer une poussée selon la direction des piques
//         switch (this.direction) {
//           case "up":
//             player.velocityY = JUMP_POWER;
//             break;
//           case "down":
//             player.velocityY = -JUMP_POWER;
//             break;
//           case "left":
//             player.velocityX = -PLAYER_SPEED;
//             break;
//           case "right":
//             player.velocityX = PLAYER_SPEED;
//             break;
//         }

//         this.canInflictDamage = false; // Prévenir les dommages continus
//         setTimeout(() => {
//           this.canInflictDamage = true;
//         }, 1000); // 1 seconde de délai avant d'infliger à nouveau des dégâts
//       }

//       if (playerLives <= 0) {
//         resetLevel();
//       }
//     }

//     this.draw();
//   }

//   checkCollisionWithPlayer(player) {
//     return (
//       player.x < this.x + this.width &&
//       player.x + player.width > this.x &&
//       player.y < this.y + this.height &&
//       player.y + player.height > this.y
//     );
//   }

//   draw() {
//     const triangleWidth = 15; // Largeur de chaque petit triangle
//     const numberOfTriangles = Math.floor(this.width / triangleWidth); // Nombre de triangles
//     ctx.fillStyle = "black";

//     for (let i = 0; i < numberOfTriangles; i++) {
//       const startX = this.x + i * triangleWidth;

//       ctx.beginPath();
//       switch (this.direction) {
//         case "up":
//           ctx.moveTo(startX, this.y + this.height);
//           ctx.lineTo(startX + triangleWidth / 2, this.y);
//           ctx.lineTo(startX + triangleWidth, this.y + this.height);
//           break;
//         case "down":
//           ctx.moveTo(startX, this.y);
//           ctx.lineTo(startX + triangleWidth / 2, this.y + this.height);
//           ctx.lineTo(startX + triangleWidth, this.y);
//           break;
//         case "left":
//           ctx.moveTo(this.x + this.width, startX);
//           ctx.lineTo(this.x, startX + triangleWidth / 2);
//           ctx.lineTo(this.x + this.width, startX + triangleWidth);
//           break;
//         case "right":
//           ctx.moveTo(this.x, startX);
//           ctx.lineTo(this.x + this.width, startX + triangleWidth / 2);
//           ctx.lineTo(this.x, startX + triangleWidth);
//           break;
//       }
//       ctx.closePath();
//       ctx.fill();
//     }
//   }
// }

// class Spike {
//   constructor(x, y, width, height, direction = "up") {
//     this.x = x;
//     this.y = y;
//     this.width = width;
//     this.height = height;
//     this.direction = direction; // 'up', 'down', 'left', 'right'
//     this.canInflictDamage = true; // To add a delay between damages
//   }

//   update(player) {
//     if (this.checkCollisionWithPlayer(player)) {
//       if (this.canInflictDamage) {
//         playerLives--; // Réduire le nombre de vies du joueur

//         // Appliquer une poussée selon la direction des piques
//         switch (this.direction) {
//           case "up":
//             player.velocityY = JUMP_POWER;
//             break;
//           case "down":
//             player.velocityY = -JUMP_POWER;
//             break;
//           case "left":
//             player.velocityX = -PLAYER_SPEED;
//             break;
//           case "right":
//             player.velocityX = PLAYER_SPEED;
//             break;
//         }

//         this.canInflictDamage = false; // Prévenir les dommages continus
//         setTimeout(() => {
//           this.canInflictDamage = true;
//         }, 1000); // 1 seconde de délai avant d'infliger à nouveau des dégâts
//       }

//       if (playerLives <= 0) {
//         resetLevel();
//       }
//     }

//     this.draw();
//   }

//   checkCollisionWithPlayer(player) {
//     return (
//       player.x < this.x + this.width &&
//       player.x + player.width > this.x &&
//       player.y < this.y + this.height &&
//       player.y + player.height > this.y
//     );
//   }

//   draw() {
//     const triangleWidth = 15; // Largeur de chaque petit triangle
//     const numberOfTriangles = Math.floor(this.height / triangleWidth); // Nombre de triangles pour les directions 'left' et 'right'
//     ctx.fillStyle = "black";

//     for (let i = 0; i < numberOfTriangles; i++) {
//       const startY = this.y + i * triangleWidth;

//       ctx.beginPath();
//       switch (this.direction) {
//         case "up":
//           ctx.moveTo(this.x, this.y + this.height);
//           ctx.lineTo(this.x + this.width / 2, this.y);
//           ctx.lineTo(this.x + this.width, this.y + this.height);
//           break;
//         case "down":
//           ctx.moveTo(this.x, this.y);
//           ctx.lineTo(this.x + this.width / 2, this.y + this.height);
//           ctx.lineTo(this.x + this.width, this.y);
//           break;
//         case "left":
//           ctx.moveTo(this.x + this.width, startY);
//           ctx.lineTo(this.x, startY + triangleWidth / 2);
//           ctx.lineTo(this.x + this.width, startY + triangleWidth);
//           break;
//         case "right":
//           ctx.moveTo(this.x, startY);
//           ctx.lineTo(this.x + this.width, startY + triangleWidth / 2);
//           ctx.lineTo(this.x, startY + triangleWidth);
//           break;
//       }
//       ctx.closePath();
//       ctx.fill();
//     }
//   }
// }

class Spike {
  constructor(x, y, width, height, direction = "up") {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.direction = direction; // 'up', 'down', 'left', 'right'
    this.canInflictDamage = true; // To add a delay between damages
  }

  update(player) {
    if (this.checkCollisionWithPlayer(player)) {
      if (this.canInflictDamage) {
        playerLives--; // Réduire le nombre de vies du joueur

        // Appliquer une poussée selon la direction des piques
        switch (this.direction) {
          case "up":
            player.velocityY = JUMP_POWER;
            break;
          case "down":
            player.velocityY = -JUMP_POWER;
            break;
          case "left":
            player.velocityX = -PLAYER_SPEED;
            break;
          case "right":
            player.velocityX = PLAYER_SPEED;
            break;
        }

        this.canInflictDamage = false; // Prévenir les dommages continus
        setTimeout(() => {
          this.canInflictDamage = true;
        }, 1000); // 1 seconde de délai avant d'infliger à nouveau des dégâts
      }

      if (playerLives <= 0) {
        resetLevel();
      }
    }

    this.draw();
  }

  checkCollisionWithPlayer(player) {
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    );
  }

  draw() {
    const triangleWidth = 15; // Largeur de chaque petit triangle
    const numberOfTriangles =
      this.direction === "up" || this.direction === "down"
        ? Math.floor(this.width / triangleWidth) // Nombre de triangles pour 'up' et 'down' dépend de la largeur
        : Math.floor(this.height / triangleWidth); // Nombre de triangles pour 'left' et 'right' dépend de la hauteur

    ctx.fillStyle = "black";

    for (let i = 0; i < numberOfTriangles; i++) {
      const startX = this.x + i * triangleWidth; // Coordonnée de départ en X pour 'up' et 'down'
      const startY = this.y + i * triangleWidth; // Coordonnée de départ en Y pour 'left' et 'right'

      ctx.beginPath();
      switch (this.direction) {
        case "up":
          ctx.moveTo(startX, this.y + this.height); // Bas du triangle
          ctx.lineTo(startX + triangleWidth / 2, this.y); // Pointe du triangle
          ctx.lineTo(startX + triangleWidth, this.y + this.height); // Bas du triangle
          break;
        case "down":
          ctx.moveTo(startX, this.y); // Haut du triangle
          ctx.lineTo(startX + triangleWidth / 2, this.y + this.height); // Pointe du triangle
          ctx.lineTo(startX + triangleWidth, this.y); // Haut du triangle
          break;
        case "left":
          ctx.moveTo(this.x + this.width, startY); // Droite du triangle
          ctx.lineTo(this.x, startY + triangleWidth / 2); // Pointe du triangle
          ctx.lineTo(this.x + this.width, startY + triangleWidth); // Droite du triangle
          break;
        case "right":
          ctx.moveTo(this.x, startY); // Gauche du triangle
          ctx.lineTo(this.x + this.width, startY + triangleWidth / 2); // Pointe du triangle
          ctx.lineTo(this.x, startY + triangleWidth); // Gauche du triangle
          break;
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof radius === "number") {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    radius = {
      tl: radius.tl || 0,
      tr: radius.tr || 0,
      br: radius.br || 0,
      bl: radius.bl || 0,
    };
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.arcTo(x + width, y, x + width, y + radius.tr, radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.arcTo(
    x + width,
    y + height,
    x + width - radius.br,
    y + height,
    radius.br
  );
  ctx.lineTo(x + radius.bl, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius.bl, radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.arcTo(x, y, x + radius.tl, y, radius.tl);
  ctx.closePath();
  ctx.fill();
}

class Wall {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  update(player) {
    this.checkCollision(player);
    this.draw();
  }

  checkCollision(player) {
    // Collision avec le côté gauche ou droit du mur
    if (
      player.x <= this.x + this.width &&
      player.x + player.width >= this.x &&
      player.y <= this.y + this.height &&
      player.y + player.height >= this.y
    ) {
      // Collision côté gauche
      if (
        player.x + player.width >= this.x &&
        player.x + player.width <= this.x + player.width
      ) {
        player.x = this.x - player.width;
      }
      // Collision côté droit
      if (
        player.x <= this.x + this.width &&
        player.x >= this.x + this.width - player.width
      ) {
        player.x = this.x + this.width;
      }

      // Collision côté haut
      if (
        player.y + player.height >= this.y &&
        player.y + player.height <= this.y + player.height
      ) {
        player.y = this.y - player.height;
        player.velocityY = 0; // Stop the player from falling through the wall
        player.onGround = true; // Consider the player as being on the ground if they collide from the top
      }

      // Collision côté bas
      if (
        player.y < this.y + this.height &&
        player.y >= this.y + this.height - player.height
      ) {
        player.y = this.y + this.height;
      }
    }
  }

  draw() {
    ctx.fillStyle = "#333";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Coin {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  draw() {
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

class Door {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.isOpen = true; // La porte est fermée par défaut
  }

  update(player) {
    if (this.isPlayerNear(player)) {
      this.isOpen = true;
      this.goToNextLevel();
    }

    this.draw();
  }

  isPlayerNear(player) {
    return (
      player.x + player.width > this.x &&
      player.x < this.x + this.width &&
      player.y + player.height > this.y &&
      player.y < this.y + this.height
    );
  }

  goToNextLevel() {
    currentLevel++;
    if (currentLevel < levels.length) {
      loadLevel(currentLevel);
    } else {
      messageBox.textContent = "You've completed all levels!";
    }
  }

  draw() {
    ctx.fillStyle = this.isOpen ? "orange" : "brown";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "black";
    drawRoundedRect(ctx, this.x - 25, this.y + this.height, 85, 20, 10);
  }
}

function createPlatformButtons() {
  const platformButtonsDiv = document.getElementById("platform-buttons");
  platformButtonsDiv.innerHTML = ""; // Clear existing buttons

  types.forEach((type) => {
    const button = document.createElement("button");
    button.textContent = type;
    button.classList.add("platform-button");
    button.addEventListener("click", () => {
      if (player.nearPlatform && player.platformMessage) {
        setActiveButton(type);
        player.changePlatformType(player.platformMessage, type);
      }
    });
    platformButtonsDiv.appendChild(button);
  });
}

// Set the active button based on the platform type
function setActiveButton(type) {
  const buttons = document.querySelectorAll("#platform-buttons button");
  buttons.forEach((button) => {
    if (button.textContent === type) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}
function resetButtonStyles() {
  const buttons = document.querySelectorAll(".platform-button");
  buttons.forEach((button) => {
    button.classList.remove("active");
  });
}

function isInputActive() {
  const newNameInput = document.getElementById("new-name");
  return document.activeElement === newNameInput;
}

// Exemple de niveau
const levels = [
  // level 1
  {
    player: { x: 75, y: 200 },
    platforms: [{ type: "Right", x: 50, y: 300, width: 100, height: 20 }],
    coins: [
      { x: 200, y: 225, radius: 10 },
      { x: 300, y: 225, radius: 10 },
      { x: 375, y: 225, radius: 10 },
      { x: 450, y: 225, radius: 10 },
      { x: 525, y: 225, radius: 10 },
    ],
    doors: [{ x: 500, y: 100, width: 40, height: 50 }],
    walls: [],
    spikes: [
      { x: -2, y: 390, width: 705, height: 10, direction: "up" }, // Piques orientées vers le haut
    ],
  },
  // level 2
  {
    player: { x: 100, y: 300 },
    platforms: [{ type: "Right", x: 50, y: 360, width: 100, height: 20 }],
    coins: [{ x: 250, y: 270, radius: 10 }],
    doors: [{ x: 100, y: 100, width: 40, height: 50 }],
    walls: [
      { x: 10, y: 10, width: 50, height: 270 },
      { x: 10, y: 10, width: 680, height: 50 },
      { x: 10, y: 180, width: 550, height: 10 },
      { x: 10, y: 200, width: 550, height: 80 },
      { x: 680, y: 220, width: 10, height: 170 },
    ],
    spikes: [
      { x: 250, y: 170, width: 250, height: 10, direction: "up" }, // Piques orientées vers le haut
      // { x: 400, y: 100, width: 50, height: 20, direction: "down" }, // Piques orientées vers le bas
      { x: 670, y: 250, width: 10, height: 100, direction: "left" }, // Piques orientées vers le bas
    ],
  },
  // level 3
  {
    player: { x: 100, y: 300 },
    platforms: [{ type: "Right", x: 50, y: 360, width: 100, height: 20 }],
    coins: [
      { x: 250, y: 320, radius: 10 },
      { x: 300, y: 270, radius: 10 },
      { x: 350, y: 220, radius: 10 },
      { x: 400, y: 170, radius: 10 },
      { x: 600, y: 320, radius: 10 },
      { x: 640, y: 320, radius: 10 },
      { x: 600, y: 350, radius: 10 },
      { x: 640, y: 350, radius: 10 },
    ],
    doors: [{ x: 385, y: 70, width: 40, height: 50 }],
    walls: [
      { x: 10, y: 10, width: 200, height: 270 },
      { x: 10, y: 10, width: 250, height: 220 },
      { x: 10, y: 10, width: 300, height: 170 },
      { x: 500, y: 10, width: 190, height: 170 },
      { x: 370, y: 300, width: 190, height: 170 },
      { x: 680, y: 250, width: 10, height: 130 },
      { x: 350, y: 300, width: 10, height: 100 },
    ],
    spikes: [
      { x: 400, y: 290, width: 120, height: 10, direction: "up" }, // Piques orientées vers le haut
      { x: 580, y: 390, width: 80, height: 10, direction: "up" }, // Piques orientées vers le bas
    ],
  },

  // level 4
  {
    player: { x: 75, y: 50 },
    platforms: [{ type: "Right", x: 50, y: 120, width: 100, height: 20 }],
    coins: [
      { x: 100, y: 340, radius: 20 },
      { x: 233, y: 340, radius: 20 },
      { x: 365, y: 340, radius: 20 },

      { x: 580, y: 100, radius: 20 },
    ],
    doors: [{ x: 560, y: 310, width: 40, height: 50 }],
    walls: [
      { x: 450, y: -50, width: 20, height: 480 },

      { x: 0, y: 150, width: 700, height: 15 },
    ],
    spikes: [],
  },
  // level 5
  {
    player: { x: 125, y: 250 },
    platforms: [
      { type: "Right", x: 100, y: 300, width: 100, height: 20 },
      { type: "Right", x: 580, y: 350, width: 100, height: 20 },
    ],
    coins: [
      { x: 630, y: 320, radius: 10 },
      { x: 630, y: 290, radius: 10 },
      { x: 630, y: 260, radius: 10 },
    ],
    doors: [{ x: 350, y: 25, width: 40, height: 50 }],
    walls: [
      { x: 0, y: 0, width: 90, height: 400 },
      { x: 90, y: 0, width: 225, height: 230 },
      { x: 215, y: 110, width: 350, height: 400 },
      { x: 90, y: 340, width: 125, height: 230 },
      { x: 420, y: 0, width: 280, height: 230 },
    ],
    spikes: [],
  },
];

function loadLevel(levelIndex) {
  const levelData = levels[levelIndex];

  platforms.length = 0;
  coins.length = 0;
  doors.length = 0;
  walls.length = 0;
  spikes.length = 0;

  player.x = levelData.player.x;
  player.y = levelData.player.y;

  levelData.platforms.forEach((data) => {
    switch (data.type) {
      case "Right":
        platforms.push(new Right(data.x, data.y, data.width, data.height));
        break;
      case "Up":
        platforms.push(new Up(data.x, data.y, data.width, data.height));
        break;
    }
  });

  levelData.walls.forEach((data) => {
    walls.push(new Wall(data.x, data.y, data.width, data.height)); // Ajout des murs
  });

  levelData.coins.forEach((data) => {
    coins.push(new Coin(data.x, data.y, data.radius));
  });

  levelData.doors.forEach((data) => {
    doors.push(new Door(data.x, data.y, data.width, data.height));
  });

  // Ajouter des piques
  levelData.spikes.forEach((data) => {
    spikes.push(
      new Spike(data.x, data.y, data.width, data.height, data.direction)
    );
  });

  // Réinitialiser la couleur des boutons après le chargement du niveau
  resetButtonStyles();
}

const player = new Player(100, 300);
const platformClasses = {
  Right,
  //   Up,
};

function resetLevel() {
  loadLevel(currentLevel);
}

function drawGrid() {
  ctx.strokeStyle = "rgb(20,20,20)";
  ctx.lineWidth = 1;

  // Dessiner des lignes verticales tous les 50 pixels
  for (let x = 0; x < canvas.width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Dessiner des lignes horizontales tous les 50 pixels
  for (let y = 0; y < canvas.height; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.update(platforms, coins, enemies, walls);
  platforms.forEach((platform) => platform.update(player));
  coins.forEach((coin) => coin.draw());
  doors.forEach((door) => door.update(player));
  walls.forEach((wall) => wall.update(player));
  spikes.forEach((spike) => spike.update(player)); // Ajout de cette ligne

  // Dessiner la grille si le niveau est supérieur ou égal à 5
  if (currentLevel == 4) {
    drawGrid();
  }

  // ctx.fillStyle = "black";
  ctx.fillStyle = "orange";
  ctx.font = "20px Arial";
  ctx.fillText(`Coins: ${collectedCoins}`, canvas.width - 100, 30);
  // ctx.fillText(`Lives: ${playerLives}`, 10, 30);

  requestAnimationFrame(gameLoop);
}

createPlatformButtons();
loadLevel(currentLevel);
gameLoop();
