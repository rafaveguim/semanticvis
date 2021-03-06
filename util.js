

var util = new function(){


    this.insertAfter = function (newElemName, anchor, namespace){
        var t = document.createElementNS(namespace, newElemName);
        anchor.parentNode.insertBefore(t, anchor.nextSibling);

        return t;
    }


    this.fontMeasureCache = {};

    /**
     * Finds the font size that will fit within width and height, starting with
     * iniSize.
     * @param font an object Font.js (see https://github.com/Pomax/Font.js)
     * @param text string to be measured
     * @param iniSize initial size
     * @param [minSize=0] if ideal size is less than minSize, returns null
     * @return an object like {size: number, width: number, height: number}
     */
    this.adjustFontSize = function(font, text, width, height, iniSize, minSize){

        minSize = (typeof minSize === "undefined") ? 0 : minSize;

        if (!this.fontMeasureCache[font.fontFamily])
            this.initChache(font, [minSize, iniSize], [2, 15]);

        var currSize = iniSize;

        do {
            var m = null;
            try {
                m = this.fontMeasureCache[font.fontFamily][currSize][text.length];
            } catch (e){
                console.log("Error obtaining measuring info for font \'"+font.fontFamily+
                    "\', string \'"+text+"\', size "+currSize);
            }
            if (!m)
                m = font.measureText(text, currSize);

            currSize -= 1;
        } while ( (m.width > width || m.height > height) && currSize>=minSize);

        if (currSize >= minSize)
            return {size: currSize, width: m.width, height:m.height};
        else
            return null;
    }



    /**
     * Calculates the measureCache info for this font
     */
    this.initChache = function(font, sizeRange, lengthRange){
        var cache = {};
        for (var s=sizeRange[1]; s>=sizeRange[0]; s--){  // font size
            var entry = {};
            for (var l=lengthRange[1]; l>=lengthRange[0]; l--)         // word length
                entry[l] = font.measureText(this.randomString(l),s);
            cache[s] = entry;
        }
        this.fontMeasureCache[font.fontFamily] = cache;
    }

    this.randomString = function(length){
        var alphabet = "abcdefghijklmnopqrstuvwxyz_0123456789",
            result   = "";

        for (var i=0; i<length; i++){
            var index = parseInt(Math.random()*alphabet.length);
            result+=alphabet[index];
        }

        return result;
    }


    this.toInt = function (str){
        return +str.replace(/[a-zA-Z]/g, '');
    }
}
