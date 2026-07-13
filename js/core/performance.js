//----------------------------------
// Performance Profiler
//----------------------------------

const PERF = {

    marks: {},

    //----------------------------------
    // Start Timer
    //----------------------------------

    start(name) {

        this.marks[name] = performance.now();

    },

    //----------------------------------
    // End Timer
    //----------------------------------

    end(name) {

        if (!(name in this.marks)) return;

        const elapsed =
            performance.now() -
            this.marks[name];

        console.log(
            `⏱ ${name}: ${elapsed.toFixed(2)} ms`
        );

        delete this.marks[name];

    }

};

window.PERF = PERF;