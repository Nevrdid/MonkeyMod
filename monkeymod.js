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

    getTop1k1() {
      return 'as I his that he was for on are with they be at one have this from by hot word but what some is it you or had the of to and a in we can out other were which do their time if will how said an each tell does set three want air well also play small end put home read hand port large spell add even land here must big high such follow act why ask men change went light kind off need house picture try us again animal point mother world near build self earth father any new work part take get place made live where after back little only round man year came show every good me give our under name very through just form sentence great think say help low line differ turn cause much mean before move right boy old too same she all there when up use your way about many then them write would like so these her long make thing see him two has look more day could go come did number sound no most people my over know water than call first who may down side been now find head'
    }

    getTop1k2() {
      return 'stand own page should country found answer school grow study still learn plant cover food sun four between state keep eye never last let thought city tree cross farm hard start might story saw far sea draw left late run don’t while press close night real life few north book carry took science eat room friend began idea fish mountain stop once base hear horse cut sure watch color face wood main open seem together next white children begin got walk example ease paper group always music those both mark often letter until mile river car feet care second enough plain girl usual young ready above ever red list though feel talk bird soon body dog family direct pose leave song measure door product black short numeral class wind question happen complete ship area half rock order fire south problem piece told knew pass since top whole king street inch multiply nothing course stay wheel full force blue object decide surface deep moon island foot system busy test record boat common gold possible plane stead dry wonder laugh thousand ago ran check game shape equate hot miss brought heat snow tire bring yes distant fill east paint language among unit power'
    }

    getTop1k3() {
      return 'town fine certain fly fall lead cry dark machine note wait plan figure star box noun field rest correct able pound done beauty drive stood contain front teach week final gave green oh quick develop ocean warm free minute strong special mind behind clear tail produce fact space heard best hour better true during hundred five remember step early hold west ground interest reach fast verb sing listen six table travel less morning ten simple several vowel toward war lay against pattern slow center love person money serve appear road map rain rule govern pull cold notice voice energy hunt probable bed brother egg ride cell believe perhaps pick sudden count square reason length represent art subject region size vary settle speak weight general ice matter circle pair include divide syllable felt grand ball yet wave drop heart am present heavy dance engine position arm wide sail material fraction forest sit race window store summer train sleep prove lone leg exercise wall catch mount wish sky board joy winter sat written wild instrument kept glass grass cow job edge sign visit past soft fun bright gas weather month million bear finish happy hope flower clothe strange gone trade melody trip office'
    }

    getTop1k4() {
      return 'receive row mouth exact symbol die least trouble shout except wrote seed tone join suggest clean break lady yard rise bad blow oil blood touch grew cent mix team wire cost lost brown wear garden equal sent choose fell fit flow fair bank collect save control decimal ear else quite broke case middle kill son lake moment scale loud spring observe child straight consonant nation dictionary milk speed method organ pay age section dress cloud surprise quiet stone tiny climb cool design poor lot experiment bottom key iron single stick flat twenty skin smile crease hole jump baby eight village meet root buy raise solve metal whether push seven paragraph third shall held hair describe cook floor either result burn hill safe cat century consider type law bit coast copy phrase silent tall sand soil roll temperature finger industry value fight lie beat excite natural view sense capital won’t chair danger fruit rich thick soldier process operate practice separate difficult doctor please protect noon crop modern element hit student corner party supply whose locate ring character insect caught period indicate radio spoke atom human history effect electric expect bone rail imagine provide agree thus gentle woman captain guess necessary sharp wing'
    }

    getTop1k5() {
      return 'create neighbor wash bat rather crowd corn compare poem string bell depend meat rub tube famous dollar stream fear sight thin triangle planet hurry chief colony clock mine tie enter major fresh search send yellow gun allow print dead spot desert suit current lift rose arrive master track parent shore division sheet substance favor connect post spend chord fat glad original share station dad bread charge proper bar offer segment slave duck instant market degree populate chick dear enemy reply drink occur support speech nature range steam motion path liquid log meant quotient teeth shell neck oxygen sugar death pretty skill women season solution magnet silver thank branch match suffix especially fig afraid huge sister steel discuss forward similar guide experience score apple bought led pitch coat mass card band rope slip win dream evening condition feed tool total basic smell valley nor double seat continue block chart hat sell success company subtract event particular deal swim term opposite wife shoe shoulder spread arrange camp invent cotton born determine quart nine truck noise level chance gather shop stretch throw shine property column molecule select wrong gray repeat require broad prepare salt nose plural anger claim continent'
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
      this.addLoadButton('Top1k1', this.getTop1k1(), groupDiv);
      this.addLoadButton('Top1k2', this.getTop1k2(), groupDiv);
      this.addLoadButton('Top1k3', this.getTop1k3(), groupDiv);
      this.addLoadButton('Top1k4', this.getTop1k4(), groupDiv);
      this.addLoadButton('Top1k5', this.getTop1k5(), groupDiv);
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
