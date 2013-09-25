var helpers = require('../message/helpers');

describe('BoxedFloat', function() {

    it("compares with regular numbers", function() {
        var num = new helpers.BoxedFloat(5.0);

        // Check both sides
        expect(4 < num).toBeTruthy();
        expect(num > 4).toBeTruthy();

        expect(6 > num).toBeTruthy();
        expect(num < 6).toBeTruthy();

        expect(num == 5).toBeTruthy();
    });

})

