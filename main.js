// Waiting until document has loaded
window.onload = () => {

  // YOUR CODE GOES HERE
  // --- 1. SETUP DIMENSIONS ---
    const width = 600;
    const height = 500;
    const margin = { top: 40, right: 150, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // --- 2. LOAD DATA ---
    d3.csv("cars.csv").then(data => {
        
        // Data Conversion: Parse numbers from strings
        data.forEach(d => {
            d.Price = +d["Retail Price"];
            d.HP = +d["Horsepower(HP)"];
            d.CityMPG = +d["City Miles Per Gallon"];
            d.Weight = +d["Weight"];
            d.Engine = +d["Engine Size (l)"];
            d.DealerCost = +d["Dealer Cost"];
            d.AWD = +d["AWD"];
            d.RWD = +d["RWD"];
        });

        // SPECIAL: Get a list of all unique Car Types for the "Type" axis
        // We need this to map text ("Sedan", "SUV") to numbers (0, 1, 2...)
        const allTypes = Array.from(new Set(data.map(d => d.Type))).sort();

        // --- 3. SCALES ---
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.HP)])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Price)])
            .range([innerHeight, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(data.map(d => d.Type));

        // --- 4. AXES ---
        svg.append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale));

        svg.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 40)
            .style("text-anchor", "middle")
            .text("Horsepower (HP)");

        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -45)
            .style("text-anchor", "middle")
            .text("Retail Price ($)");

        // --- 5. CIRCLES ---
        const circles = svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.HP))
            .attr("cy", d => yScale(d.Price))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.Type));

        // --- 6. INTERACTION ---
        circles.on("click", function(d) {
            circles.classed("selected", false);
            d3.select(this).classed("selected", true);
            updateDetails(d); 
        });

        // --- 7. LEGEND ---
        const legend = svg.append("g")
            .attr("transform", `translate(${innerWidth + 20}, 0)`);

        const types = colorScale.domain();
        types.forEach((type, i) => {
            const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
            row.append("rect").attr("width", 10).attr("height", 10).attr("fill", colorScale(type));
            row.append("text").attr("x", 15).attr("y", 10).style("font-size", "12px").text(type);
        });

        // --- HELPER: Update Text & Star Plot ---
        function updateDetails(car) {
            
            // A. UPDATE TEXT DETAILS
            const textContainer = d3.select("#text-details");
            const htmlContent = `
                <h4>${car.Name}</h4>
                <div style="font-size: 14px; line-height: 1.6;">
                    Type: <b>${car.Type}</b><br>
                    AWD: <b>${car.AWD}</b> | RWD: <b>${car.RWD}</b><br>
                    Retail Price: <b>$${car.Price}</b><br>
                    Dealer Cost: <b>$${car.DealerCost}</b><br>
                    Engine Size: <b>${car.Engine}L</b>
                </div>
                <hr>
            `;
            textContainer.html(htmlContent);

            // B. UPDATE STAR PLOT
            const starContainer = d3.select("#starplot");
            starContainer.html(""); // Clear old plot

            const w = 300, h = 300;
            const radius = 100;
            const svgStar = starContainer.append("svg")
                .attr("width", w).attr("height", h)
                .append("g")
                .attr("transform", `translate(${w/2},${h/2})`);

            // The 6 attributes requested (including Type)
            const starFeatures = [
                { key: "Type", label: "Type" }, // Added Type here
                { key: "AWD", label: "AWD" },
                { key: "RWD", label: "RWD" },
                { key: "Price", label: "Retail Price" },
                { key: "DealerCost", label: "Dealer Cost" },
                { key: "Engine", label: "Engine Size" }
            ];
            
            // Scales for Star Plot
            const scales = {};
            starFeatures.forEach(f => {
                if (f.key === "Type") {
                    // Special scale for Type (Categorical -> Number)
                    scales[f.key] = d3.scaleLinear()
                        .domain([0, allTypes.length - 1])
                        .range([0, radius]);
                } else {
                    // Standard scale for numbers
                    scales[f.key] = d3.scaleLinear()
                        .domain([0, d3.max(data, d => d[f.key])])
                        .range([0, radius]);
                }
            });

            const angleSlice = (Math.PI * 2) / starFeatures.length;

            // Draw Axes
            starFeatures.forEach((f, i) => {
                const angle = i * angleSlice - Math.PI/2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                svgStar.append("line")
                    .attr("x1", 0).attr("y1", 0).attr("x2", x).attr("y2", y)
                    .attr("class", "axis-line");

                svgStar.append("text")
                    .attr("x", x * 1.2).attr("y", y * 1.2)
                    .text(f.label)
                    .style("font-size", "11px")
                    .style("text-anchor", "middle");
            });

            // Draw Shape
            const coords = starFeatures.map((f, i) => {
                const angle = i * angleSlice - Math.PI/2;
                let val;

                // Handle Type specially (convert string to index number)
                if (f.key === "Type") {
                    val = allTypes.indexOf(car.Type);
                } else {
                    val = car[f.key];
                }

                const r = scales[f.key](val);
                return { x: Math.cos(angle)*r, y: Math.sin(angle)*r };
            });

            const line = d3.line()
                .x(d => d.x).y(d => d.y)
                .curve(d3.curveLinearClosed);

            svgStar.append("path")
                .datum(coords)
                .attr("d", line)
                .attr("class", "star-path")
                .attr("fill", colorScale(car.Type))
                .attr("stroke", colorScale(car.Type));
        }

    });
  
};
