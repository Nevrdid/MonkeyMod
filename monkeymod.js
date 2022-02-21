// ==UserScript==
// @name         MonkeyMod
// @version      0.2
// @description  Stuff I wish MonkeyType had
// @author       Alex
// @include      https://monkeytype.com/*
// ==/UserScript==

(function() {
  class Config {
    getAll() {
      const stored = localStorage.getItem('monkeyFilterConfig');
      if (typeof stored !== 'string') {
        return this.defaultConfig();
      }
      try {
        return Object.assign(this.defaultConfig(), JSON.parse(stored));
      } catch (e) {
        return {};
      }
    }

    get(key) {
      const storedValue = this.getAll()[key];
      return storedValue || this.defaultConfig()[key];
    }

    set(key, value) {
      const all = this.getAll();
      all[key] = value;
      localStorage.setItem('monkeyFilterConfig', JSON.stringify(all));
      this.show();
    }

    getSuccessThreshold() {
      return parseInt(this.get('successThreshold'));
    }

    setSuccessThreshold(value) {
      this.set('successThreshold', value);
    }

    getStepSize() {
      return parseInt(this.get('stepSize'));
    }

    incrementThreshold() {
      const newValue = this.getSuccessThreshold() + this.getStepSize();
      this.setSuccessThreshold(newValue);
    }

    getGameStartingThreshold() {
      return parseInt(this.get('gameStartingThreshold'));
    }

    defaultConfig() {
      return {
        successThreshold: 70,
        gameStartingThreshold: 50,
        stepSize: 5,
      };
    }

    show() {
      if (this.floatingContainer) {
        this.floatingContainer.parentNode.removeChild(this.floatingContainer);
      }
      const floatingContainer = document.createElement('div');
      floatingContainer.style.width = '200px';
      floatingContainer.style.height = '200px';
      floatingContainer.style.position = 'fixed';
      floatingContainer.style.left = '0';
      floatingContainer.style.top = '0';
      const all = this.getAll();
      for (const property in all) {
        const container = document.createElement('span');
        const input = document.createElement('input');
        const label = document.createElement('span');
        label.innerText = property;
        input.value = all[property];
        container.appendChild(label);
        container.appendChild(input);
        input.addEventListener('blur', () => this.set(property, input.value));
        floatingContainer.appendChild(container);
      }

      this.floatingContainer = floatingContainer;
      document.body.appendChild(floatingContainer);
    }
  }

  class MonkeyMod {
    constructor(monkeyType, config) {
      this.monkeyType = monkeyType;
      this.config = config;
      this.gamewords = [];
      this.gameRunning = false;
    }

    init() {
      this.config.show();
      this.addInfoContainer();
      this.addNextButton();
      this.addLoadButtons();
      this.addGameButtons();
      this.watchForStateChange();

      this.monkeyType.getSubmitCustomWordsButton().addEventListener('click', () => {
        this.wordCountSpan.innerText = this.monkeyType.getCurrentWordCount();
      });
    }

    startGame() {
      this.runningGame = new Game(this.config, this.monkeyType, this);
    }

    stopGame() {
      this.runningGame = null;
    }

    // I removed "I" from the top 200
    getTop199() {
      return 'the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line';
    }

    getNGrams() {
      return 'the and ing ion tio ent ati for her ter hat tha ere ate his con res ver all ons nce men ith ted ers pro thi wit are ess not ive was ect rea com eve per int est sta cti ica ist ear ain one our iti rat tion atio that ther with ment ions this here from ould ting hich whic ctio ence have othe ight sion ever ical they inte ough ance were tive over ding pres nter comp able heir thei ally ated ring ture cont ents cons rati thin part form ning ecti some ation tions which ction other their there ition ement inter ional ratio would tiona these state natio thing under ssion ectio catio latio about count ments rough ative prese feren hough ution roduc resen thoug press first after cause where tatio could efore contr hould shoul tical gener esent great';
    }

    addInfoContainer() {
      const infoDiv = document.createElement('div');
      infoDiv.appendChild(this.getLastRemovedDiv());
      infoDiv.appendChild(this.getWordCountDiv());
      this.monkeyType.centerContent().prepend(infoDiv);
    }

    getLastRemovedDiv() {
      const lastRemovedWordsContainerDiv = document.createElement('div');
      const lastRemovedWordsPrefixSpan = document.createElement('span');
      lastRemovedWordsPrefixSpan.innerText = 'Last words removed: ';
      const lastRemovedWordsSpan = document.createElement('span');
      lastRemovedWordsContainerDiv.appendChild(lastRemovedWordsPrefixSpan);
      lastRemovedWordsContainerDiv.appendChild(lastRemovedWordsSpan);
      this.lastRemovedWordsSpan = lastRemovedWordsSpan;
      return lastRemovedWordsContainerDiv;
    }

    getWordCountDiv() {
      const wordCountContainerDiv = document.createElement('div');
      const wordCountContainerPrefixSpan = document.createElement('span');
      wordCountContainerPrefixSpan.innerText = 'Words remaining: ';
      const wordCountSpan = document.createElement('span');
      wordCountContainerDiv.appendChild(wordCountContainerPrefixSpan);
      wordCountContainerDiv.appendChild(wordCountSpan);
      this.wordCountSpan = wordCountSpan;
      return wordCountContainerDiv;
    }

    addNextButton() {
      const button = document.createElement('button');
      button.innerText = 'Next';
      this.monkeyType.getResultsWordHistoryContainer().appendChild(button);
      button.addEventListener('click', () => {
        if (this.monkeyType.hasErrors()) {
          this.monkeyType.clickNextTestButton();
        } else {
          this.removeOverThreshold();
        }
      });
    }

    addLoadButtons() {
      const groupDiv = document.createElement('div');
      groupDiv.classList.add('group');
      this.monkeyType.desktopConfigDiv().appendChild(groupDiv);
      this.addLoadButton('Top199', this.getTop199(), groupDiv);
      this.addLoadButton('ngrams', this.getNGrams(), groupDiv);
    }

    addGameButtons() {
      const groupDiv = document.createElement('div');
      groupDiv.classList.add('group');
      this.monkeyType.desktopConfigDiv().appendChild(groupDiv);
      const startButton = this.textButton('start');
      const stopButton = this.textButton('stop');
      groupDiv.appendChild(startButton);
      groupDiv.appendChild(stopButton);
      startButton.addEventListener('click', () => this.startGame());
      stopButton.addEventListener('click', () => this.stopGame());
    }

    textButton(name) {
      const button = document.createElement('span');
      button.innerText = name;
      button.classList.add('text-button');
      button.style.fontSize = '0.7rem';
      button.style.marginRight = '10px';

      return button;
    }

    addLoadButton(name, text, container) {
      const button = this.textButton(name);
      container.appendChild(button);
      button.addEventListener('click', () => {
        this.updateWordsWithString(text);
      });
    }

    updateWords(newWords) {
      this.monkeyType.getCustomWordsTextArea().value = newWords.join(' ');
      this.monkeyType.clickSubmitCustomWordsButton();
    }

    updateWordsWithString(string) {
      this.updateWords(string.split(' '));
    }

    removeWords(wordsToRemove) {
      const unique = [...new Set(wordsToRemove)];
      const difference = this.monkeyType.getCurrentCustomWords().filter((word) => !unique.includes(word));
      this.lastRemovedWordsSpan.innerText = unique.join(' ');
      this.updateWords(difference);
    }

    removeOverThreshold() {
      const resultWords = this.monkeyType.getResultWords();
      if (resultWords.length === 0) {
        return;
      }

      const toRemove = resultWords.filter((word) => word.wpm() > this.config.getSuccessThreshold());

      if (toRemove.length > 0) {
        this.removeWords(toRemove.map((word) => word.typedInput()));
      } else {
        this.monkeyType.clickNextTestButton();
      }
    }

    watchForStateChange() {
      const targetNode = this.monkeyType.getTypingTestContainer();
      const config = { attributes: true, childList: false, subtree: false };

      const callback = (mutationsList) => {
        mutationsList.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            if (mutation.target.classList.contains('hidden')) {
              this.onResultsShown();
            } else {
              this.onTestShown();
            }
          }
        });
      };
      const observer = new MutationObserver(callback);
      observer.observe(targetNode, config);
    }

    onResultsShown() {
      if (this.runningGame) {
        this.runningGame.onResultsShown();
      }
    }

    onTestShown() {
      if (this.runningGame) {
        this.runningGame.onTestShown();
      }
    }
  }


  class MonkeyType {
    find(selector) {
      return document.querySelector(selector);
    }

    centerContent() {
      return this.find('#centerContent');
    }

    getTypingTestContainer() {
      return document.getElementById('typingTest');
    }

    getSubmitCustomWordsButton() {
      return document.querySelector('#customTextPopup .button.apply');
    }

    clickSubmitCustomWordsButton() {
      this.getSubmitCustomWordsButton().click();
    }

    desktopConfigDiv() {
      return this.find('.desktopConfig');
    }

    getResultsWordHistoryContainer() {
      return document.getElementById('resultWordsHistory');
    }

    getNextTestButton() {
      return document.getElementById('nextTestButton');
    }

    clickNextTestButton() {
      this.getNextTestButton().click();
    }

    getCustomWordsTextArea() {
      return document.querySelector('#customTextPopup textarea');
    }

    getCurrentCustomWords() {
      return this.getCustomWordsTextArea().value.split(' ').filter((word) => word !== '');
    }

    getCurrentWordCount() {
      return parseInt(this.getCurrentCustomWords().length);
    }

    getResultWords() {
      const resultWordDivs = [...document.querySelectorAll('.words .word')];
      return resultWordDivs.map((div) => new ResultWord(div));
    }

    getErrors() {
      return [...document.querySelectorAll('.word.error')];
    }

    hasErrors() {
      return this.getErrors().length > 0;
    }
  }

  class ResultWord {
    constructor(div) {
      this.div = div;
    }

    wpm() {
      return parseInt(this.div.getAttribute('burst'));
    }

    typedInput() {
      return this.div.getAttribute('input');
    }

    isWrong() {
      return this.div.classList.contains('error');
    }

    wasTypedCorrectly() {
      return !this.div.classList.contains('error') && this.div.hasAttribute('input');
    }
  }

  class Game {
    constructor(config, monkeyType, monkeyMod) {
      this.config = config;
      this.monkeyType = monkeyType;
      this.monkeyMod = monkeyMod;
      this.config.setSuccessThreshold(this.config.getGameStartingThreshold());
      this.startingWords = [...new Set(monkeyType.getCurrentCustomWords())];
      this.wordStats = {};
      this.startingWords.forEach((word) => {
        this.wordStats[word] = new WordStat(word);
      });
    }

    onTestShown() {
      if (this.monkeyType.getCurrentWordCount() === 0) {
        this.config.incrementThreshold();
        const newWords = this.startingWords.filter((word) => {
          const stat = this.wordStats[word];
          return !stat.hasBeenTypedFasterThan(this.config.getSuccessThreshold());
        });
        this.monkeyMod.updateWords(newWords);
      }
    }

    onResultsShown() {
      const correctWords = this.monkeyType.getResultWords().filter((result) => result.wasTypedCorrectly());
      correctWords.forEach((correctWord) => {
        const stat = this.wordStats[correctWord.typedInput()];
        let wpm = correctWord.wpm();
        stat.addSpeed(wpm);
      });
    }
  }

  class WordStat {
    constructor(word) {
      this.word = word;
      this.speeds = [];
    }

    typedCount() {
      return this.speeds.length;
    }

    addSpeed(wpm) {
      this.speeds.push(wpm);
    }

    hasBeenTypedFasterThan(wpm) {
      if (this.typedCount() < 1) {
        return false;
      }

      return Math.max(...this.speeds) >= wpm;
    }
  }

  const monkeyType = new MonkeyType();
  const config = new Config();
  const mod = new MonkeyMod(monkeyType, config);
  mod.init();
})();
