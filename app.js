(function () {
  var config = window.KINDLE_DAILY_CONFIG || {};
  var quotes = config.quotes || [];

  function $(id) {
    return document.getElementById(id);
  }

  function pad(value) {
    return String(value).length === 1 ? "0" + value : String(value);
  }

  function dayKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function hashText(text) {
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function chooseQuote(date) {
    if (!quotes.length) {
      return {
        text: "请在 quotes.js 中加入你的语录库。",
        source: ""
      };
    }
    return quotes[hashText(dayKey(date)) % quotes.length];
  }

  function weatherCode(code) {
    var map = {
      0: ["晴", "☼"],
      1: ["大致晴朗", "☼"],
      2: ["局部多云", "☁"],
      3: ["阴", "☁"],
      45: ["有雾", "≋"],
      48: ["雾凇", "≋"],
      51: ["小毛毛雨", "雨"],
      53: ["毛毛雨", "雨"],
      55: ["较强毛毛雨", "雨"],
      61: ["小雨", "雨"],
      63: ["中雨", "雨"],
      65: ["大雨", "雨"],
      71: ["小雪", "雪"],
      73: ["中雪", "雪"],
      75: ["大雪", "雪"],
      80: ["阵雨", "雨"],
      81: ["较强阵雨", "雨"],
      82: ["强阵雨", "雨"],
      95: ["雷雨", "雷"],
      96: ["雷雨伴冰雹", "雷"],
      99: ["强雷雨伴冰雹", "雷"]
    };
    return map[code] || ["天气变化", "--"];
  }

  function renderDate(now) {
    var week = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    $("dateText").textContent = now.getFullYear() + "年" + (now.getMonth() + 1) + "月" + now.getDate() + "日 · " + week[now.getDay()];
    $("locationText").textContent = config.locationName || "当前位置";
  }

  function renderQuote(now) {
    var quote = chooseQuote(now);
    $("quoteText").textContent = quote.text;
    $("quoteSource").textContent = quote.source ? "—— " + quote.source : "";
  }

  function renderWeather(data) {
    var current = data.current || {};
    var details = weatherCode(current.weather_code);
    $("weatherIcon").textContent = details[1];
    $("temperatureText").textContent = Math.round(current.temperature_2m) + "°";
    $("weatherDesc").textContent = details[0];
    $("weatherMeta").textContent = "体感 " + Math.round(current.apparent_temperature) + "° · 风速 " + Math.round(current.wind_speed_10m) + " km/h · 湿度 " + Math.round(current.relative_humidity_2m) + "%";
    $("updatedText").textContent = "天气更新于 " + current.time;
  }

  function renderWeatherError() {
    $("weatherIcon").textContent = "--";
    $("temperatureText").textContent = "--°";
    $("weatherDesc").textContent = "天气暂时无法获取";
    $("weatherMeta").textContent = "请检查 Kindle 是否联网，或稍后刷新页面。";
    $("updatedText").textContent = "天气未更新";
  }

  function loadWeather() {
    var latitude = config.latitude || 31.2304;
    var longitude = config.longitude || 121.4737;
    var timezone = encodeURIComponent(config.timezone || "Asia/Shanghai");
    var url = "https://api.open-meteo.com/v1/forecast"
      + "?latitude=" + encodeURIComponent(latitude)
      + "&longitude=" + encodeURIComponent(longitude)
      + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
      + "&timezone=" + timezone;

    if (!window.fetch) {
      renderWeatherError();
      return;
    }

    fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Weather request failed");
        }
        return response.json();
      })
      .then(renderWeather)
      .catch(renderWeatherError);
  }

  var now = new Date();
  renderDate(now);
  renderQuote(now);
  loadWeather();
}());
