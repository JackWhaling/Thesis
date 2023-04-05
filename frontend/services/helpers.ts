export function shuffle(array: any) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function diffTime(d1: any, d2: any) {
    const d3 = new Date(d2 - d1);
    const d0 = new Date(0);

    return {
        getHours: function(){
            return d3.getHours() - d0.getHours();
        },
        getMinutes: function(){
            return d3.getMinutes() - d0.getMinutes();
        },
        getMilliseconds: function() {
            return d3.getMilliseconds() - d0.getMilliseconds();
        },
        getSeconds: function() {
            return d3.getSeconds() - d0.getSeconds();
        },
        toString: function(){
            return this.getHours() + ":" +
                   this.getMinutes() + ":" + 
                   this.getSeconds() + ":" +
                   this.getMilliseconds();
        },
    };
}