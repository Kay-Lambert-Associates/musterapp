function diffInSeconds(dt2, dt1) {
    var diff = (dt2 - dt1) / 1000;
    return Math.abs(Math.round(diff));
  }