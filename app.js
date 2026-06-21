(function () {
  var config = window.KINDLE_DAILY_CONFIG || {};
  var quotes = config.quotes || [];
  var dataVersion = "20260621-weather-calendar";

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
    setQuoteText(quote.text);
    $("quoteSource").textContent = quote.source ? "—— " + quote.source : "";
  }

  function getJSON(url, onSuccess, onError) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.onreadystatechange = function () {
      if (request.readyState !== 4) {
        return;
      }
      if (request.status >= 200 && request.status < 300) {
        try {
          onSuccess(JSON.parse(request.responseText));
        } catch (error) {
          onError();
        }
      } else {
        onError();
      }
    };
    request.onerror = onError;
    request.send();
  }

  function setQuoteText(text) {
    var quoteText = $("quoteText");
    var length = String(text || "").length;
    quoteText.className = "quote-text";
    if (length > 120) {
      quoteText.className += " quote-very-long";
    } else if (length > 72) {
      quoteText.className += " quote-long";
    }
    quoteText.textContent = text;
  }

  function renderHighlight(highlight) {
    var sourceParts = [];
    if (highlight.bookTitle) {
      sourceParts.push("《" + highlight.bookTitle + "》");
    }
    if (highlight.author) {
      sourceParts.push(highlight.author);
    }
    if (highlight.chapter) {
      sourceParts.push(highlight.chapter);
    }
    setQuoteText(highlight.text);
    $("quoteSource").textContent = sourceParts.length ? "—— " + sourceParts.join(" / ") : "—— 微信读书划线";
  }

  function loadHighlight(now) {
    if (!window.XMLHttpRequest) {
      return;
    }

    getJSON(
      "highlights.json?v=" + dataVersion + "-" + dayKey(now),
      function (data) {
        var highlights = data.highlights || [];
        if (!highlights.length) {
          return;
        }
        renderHighlight(highlights[hashText(dayKey(now)) % highlights.length]);
      },
      function () {
        // Keep the local quote fallback when WeRead highlights are unavailable.
      }
    );
  }

  function renderWeather(data) {
    var current = data.current || {};
    var details = weatherCode(current.weather_code);
    $("weatherIcon").textContent = details[1];
    $("temperatureText").textContent = Math.round(current.temperature_2m) + "°";
    $("weatherDesc").textContent = details[0];
    $("weatherMeta").textContent = "";
    renderForecast(data.daily || {});
    $("updatedText").textContent = "天气更新于 " + current.time;
  }

  function dayLabel(dateText, index) {
    if (index === 0) {
      return "今天";
    }
    if (index === 1) {
      return "明天";
    }
    var date = new Date(dateText + "T00:00:00");
    var week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return week[date.getDay()];
  }

  function renderForecast(daily) {
    var list = $("forecastList");
    var times = daily.time || [];
    var maxTemps = daily.temperature_2m_max || [];
    var minTemps = daily.temperature_2m_min || [];
    var weatherCodes = daily.weather_code || [];
    var html = "";

    for (var i = 0; i < times.length && i < 7; i += 1) {
      var details = weatherCode(weatherCodes[i]);
      var max = Math.round(maxTemps[i]);
      var min = Math.round(minTemps[i]);
      html += "<div class=\"forecast-row\">"
        + "<span class=\"forecast-day\">" + dayLabel(times[i], i) + "</span>"
        + "<span class=\"forecast-desc\">" + details[1] + "</span>"
        + "<span class=\"forecast-temp\">" + min + "° / " + max + "°</span>"
        + "</div>";
    }

    list.innerHTML = html || "<div class=\"forecast-row\"><span class=\"forecast-desc\">7天天气暂时无法获取</span></div>";
  }

  function renderWeatherError() {
    $("weatherIcon").textContent = "--";
    $("temperatureText").textContent = "--°";
    $("weatherDesc").textContent = "天气暂时无法获取";
    $("weatherMeta").textContent = "请检查 Kindle 是否联网，或稍后刷新页面。";
    $("forecastList").innerHTML = "";
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
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
      + "&forecast_days=7"
      + "&timezone=" + timezone;

    if (!window.XMLHttpRequest) {
      renderWeatherError();
      return;
    }

    getJSON(url, renderWeather, renderWeatherError);
  }

  var now = new Date();
  renderDate(now);
  renderQuote(now);
  loadHighlight(now);
  loadWeather();
}());
