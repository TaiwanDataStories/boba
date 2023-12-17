window.onload = function () {


    $("#topBarClose").on("click", function (event) {
        $(".topBar").css("display", "none");
        $(".topBar").css("opacity", 0);
    })

    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    $(window).resize(function () {
        if (windowWidth != $(window).width() || windowHeight != $(window).height()) {
            location.reload();
            return;
        }
    });


    const node = document.getElementById('finalPrint');

    $("#button").on('click', function (event) {

        domtoimage.toJpeg(document.getElementById('finalPrint'), { quality: 0.95 })
            .then(function (dataUrl) {
                var link = document.createElement('a');
                link.download = 'my-drink.jpeg';
                link.href = dataUrl;
                link.click();
            });

    })

    const tooltip = floatingTooltip('tooltip', 200);



    let menuSelected = {
        "base": "",
        "drink": "",
        "base1": "",
        "base2": "",
        "milk": "",
        "flavor": "",
        "texture": "",
        "toppings": [],
        "ice": "",
        "sweetness": "",
        "straw": "",
        "bag": ""
    }

    const toppings = ["Agar pearl", "Aloe jelly", "Boba", "Coconut jelly", "Coffee jelly", "Dried longan", "Grass jelly", "Ice cream", "Mashed sweet potato", "Millet mush", "Mung bean puree", "OREO", "Osmanthus agar pearl", "Passion fruit konje jelly", "Passionfruit puree", "Pearl", "Pineapple chunk", "Pudding", "Red beans", "Sago", "Small taro balls", "Taro ball", "Taro puree", "Ube ball", "Wood ear"];
    const delay = 400;
    let clickDisabled = false; // to keep track of function end to disable clicking of main bases during animation

    const figure = $("#chart").parent();
    const width = figure.width(); //figure.node().getBoundingClientRect().width;
    const height = 1050; //figure.node().getBoundingClientRect().height;


    const translateY = 110;

    // Prepare our physical space for SVG 1 (tree)
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('transform', `translate(20,${translateY})`)
        .attr("class", "mainG");

    const introTextG = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .attr("class", "introTextG");

    const textG = svg.append('g')
        .attr('transform', `translate(20,${translateY})`)
        .attr("class", "textG");

    const imgG = svg.append('g')
        .attr('transform', `translate(20,${translateY})`)
        .attr("class", "imgG");

    const textRectG = svg.append('g');

    //drink variables

    const categories = ["Base 1", "Base 2", "Milk", "Flavor", "Texture", ""];
    const levels = ["2", "3", "4", "5", "6", "7"];
    const wrapArray = [45, 50, 35, 50, 37, 50];
    const wrapArrayDrinks = ["fruitjuicetea", "milkbased", "milktea", "probiotics", "puretea", "seasonalfruit"];

    // all the scales
    const colorScale = d3.scaleOrdinal()
        .domain(["level1", "level2", "level3", "level4", "level5", "level6"])
        .range(["#68301b", "#8c6251", "#ae9184", "#c4aea5", "#d0beb6", "#e1d5cf"]);

    const imgNameScale = d3.scaleOrdinal()
        .domain(["level2Img", "level3Img", "level4Img", "level5Img", "level6Img", "level7Img"])
        .range(["b1", "b2", "m", "f", "t", "1"]);

    const strokeScale = d3.scaleOrdinal()
        .domain(["level", "level2", "level3", "level4", "level5", "level6"])
        .range([5, 4, 3.5, 3, 2.5, 2]);

    const fontScale = d3.scaleOrdinal()
        .domain(["1", "2", "3", "4", "5", "6", "7"])
        .range([12, 12, 11.5, 11.5, 11, 11, 11]);

    const imgYTranslateScale = d3.scaleOrdinal()
        .domain(["1", "2", "3", "4", "5", "6", "7"])
        .range([0, 50, 18, 2, 12, 12, 0]);

    const textBgYTranslateScale = d3.scaleOrdinal()
        .domain(["1", "2", "3", "4", "5", "6", "7"])
        .range([10, 12, 18, 20, 25, 25, 60]);

    const imgWidthScale = d3.scaleOrdinal()
        .domain(["2", "3", "4", "5", "6", "7"])
        .range([75, 70, 50, 60, 60, 80]);

    const textBgXTranslateScale = d3.scaleLinear().domain([30, 50]).range([5, -5]);

    const textScale = d3.scaleOrdinal().domain([0, 1, 2, 3, 4]).range(categories);

    const wrapScale = d3.scaleOrdinal().domain(wrapArrayDrinks).range(wrapArray);
    const temperatureScale = d3.scaleOrdinal().domain([1, 2, 3, 4, 5, 6, 7]).range(["Regular", "Less ice", "Some ice", "No ice", "Room temperature", "Warm", "Hot"]);
    const sweetnessScale = d3.scaleOrdinal().domain([1, 2, 3, 4, 5]).range([0, 20, 50, 80, 100]);


    // Declare d3 layout
    const vLayout = d3.tree().size([width * 0.98, height * 0.75]);
    let imgWidth = 60;

    const texture = textures
        .circles()
        .fill('#fee0d2')
        .thicker();

    svg.call(texture);

    introTextG.append("text")
        .attr("id", "introText")
        .attr("x", 0)
        .attr("y", 0)
        .style("font-size", 20)
        .style("font-family", 'Libre Franklin')
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Click on a base to start");


    //prepare data

    const arrangeData = data => {

        const reduceFn = data => d3.sum(data, d => d.count);
        const groupingFns = [d => d.Base, d => d.Base2, d => d.Milk, d => d.Flavor, d => d.Texture, d => d.drinkEN]
        const rollupData = d3.rollup(data, reduceFn, ...groupingFns);
        const childrenAccessorFn = ([key, value]) => value.size && Array.from(value)

        const hierarchyData = d3.hierarchy([null, rollupData], childrenAccessorFn)
            .sum(([key, value]) => value)
            .sort(function (a, b) {
                if (a.data[0] == "No") return -1;
                return b.value - a.value;
            })

        return hierarchyData;

    }

    //wrap text
    const wrap = (text, width) => {
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 1, //<-- 0!
                lineHeight = 1.1, // ems
                x = text.attr("x"), //<-- include the x!
                y = text.attr("y"),
                dy = text.attr("dy") ? text.attr("dy") : 0; //<-- null check
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }


    //draw shelves
    const drawBG = () => {

        g.selectAll(`image.shelf`).data(bgData).join('svg:image')
            .attr("class", "shelf")
            .attr('x', 0)
            .attr('y', (d, i) => i == 0 ? d.y0 - 40 : d.y0 - 10)
            .attr('width', width * 0.98)
            .attr('height', d => (d.y1 - d.y0))
            .attr("xlink:href", d => `./img/shelf.png`)


        g.selectAll("text.fork").data(bgData).join("text")
            .attr("class", "fork")
            .attr('x', 0)
            .attr('y', (d, i) => i == 0 ? (d.y1 - (d.y1 - d.y0) / 2 - 55) : (d.y1 - (d.y1 - d.y0) / 2 - 25)) //+5
            .style("font-family", 'Open Sans Condensed')
            .style("font-size", 18)
            .style("font-weight", 300)
            .attr("text-anchor", "start")
            .text((d, i) => textScale(i))
    }

    // draw tree
    const drawViz = (className, data) => {

        g.selectAll(`path.${className}.path`).data(data).join('path')
            .attr("class", `${className} path`)
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => className == "level1" ? d.y - 50 : d.y))

            .attr("stroke-dasharray", function () {
                const totalLength = this.getTotalLength();
                return totalLength + " " + totalLength;
            })
            .attr("stroke-dashoffset", function () {
                const totalLength = this.getTotalLength();
                return totalLength;
            })
            .transition()
            .duration(500)
            .attr("stroke-dashoffset", 0)
            .attr("opacity", 0.7)
            .attr("stroke-width", 3)
            //.attr("stroke-width",strokeScale(className))
            .attr("fill", "none")
            .attr("stroke", colorScale(className))

    }


    const drawText = (className, data) => {

        if (className == "level7Text") {
            const text = textG.selectAll(`text.${className}`).data(data).join('text')
                .attr("class", className)
                .attr("id", d => `text${d.target.data[0].replace(/ /g, "_") + className.charAt(5)}`)
                .attr("x", d => d.target.x)
                .attr("y", d => className == "level7Text" && menuSelected.base == "Milk teas" ? d.target.y + 60 : d.target.y + 80)
                .attr("dy", 1)
                .style("font-weight", 400)
                .style("font-size", 11.5)
                .style("font-family", 'Open Sans Condensed')
                .attr("text-anchor", "middle")
                .text(d => d.target.data[0])
                .call(wrap, wrapScale(selectedString) || 50);

            //then make the current selected drink font weight 700
            d3.select(`#text${menuSelected.drink.replaceAll(" ", "_")}7`).style("font-weight", 700);

        }
    }


    const drawImage = (className, data) => {

        const level = className.charAt(5)

        const img = imgG.selectAll(`image.${className}`).data(data).join('svg:image')
            .attr("class", className)
            .attr("id", d => `text${d.target.data[0].replace(/ /g, "_") + className.charAt(5)}`)
            .attr("width", className == "level7Img" && menuSelected.base == "Milk teas" ? imgWidthScale(level) - 20 : imgWidthScale(level))
            .attr("height", className == "level7Img" && menuSelected.base == "Milk teas" ? imgWidthScale(level) - 20 : imgWidthScale(level))

        img.transition().duration(500)
            .attr("x", d => className == "level7Img" && menuSelected.base == "Milk teas" ? d.target.x - imgWidthScale(level) / 2 + 10 : d.target.x - imgWidthScale(level) / 2)
            .attr("y", d => d.target.y - imgYTranslateScale(className.charAt(5)))

        img.attr("xlink:href", function (d) {
            let imgName = d.target.data[0].replaceAll(",", "");

            if (d.target.data[0] == "No") {
                if (className == "level2Img") {
                    return './img/categories/Faucet.png';
                } else {
                    return ""
                }
            } else {
                return className == "level7Img" ? `./img/drinks/${imgName} ${imgNameScale(className)}.png` : `./img/categories/${imgName} ${imgNameScale(className)}.png`
            }
        })

        if (className == "level7Img") {
            img.on("mouseover", function (e, data) {
                var id = d3.select(this).attr("id").substring(6)
                var textClass = className + "Text";
                d3.select(this).style("cursor", 'pointer');
                d3.select(`image${id}`).attr("opacity", 1);
                var select = data.target.data[0]
                var find = flatten(vRoot).find(function (d) {
                    if (d.data[0] == select)
                        return true;
                });
                doReset()
                while (find.parent) {
                    find.stroke = "5";
                    find = find.parent;
                }
                update(find);
                const content = `<span class="drinkNameBig">${select}</span>`;
                tooltip.showTooltip(content, e);

            })
                .on("mouseout", function (e) {
                    var id = d3.select(this).attr("id").substring(6)
                    d3.select(`image${id}`).style("font-size", 11.5);
                    d3.selectAll("image").attr("opacity", 1);
                    d3.selectAll("path").style("stroke-width", 3);
                    tooltip.hideTooltip();
                })
                .on("click", function (e, data) {
                    menuSelected.drink = data.target.data[0];
                    menuSelected.texture = data.source.data[0];
                    menuSelected.flavor = data.source.parent.data[0];
                    menuSelected.milk = data.source.parent.parent.data[0];
                    menuSelected.base2 = data.source.parent.parent.parent.data[0];
                    menuSelected.base1 = data.source.parent.parent.parent.parent.data[0];
                    $("#menu").css("opacity", 0.85);
                    $("#base").html(data.target.data[0]);
                    drawFinalDrink();
                    d3.selectAll(".level7Text").style("font-weight", 400);
                    d3.select(`#text${data.target.data[0].replaceAll(" ", "_")}7`).style("font-weight", 700);
                    $("#clickInstruction").css("opacity", 0);
                    $("#clickInstruction").css("display", "none");
                })
        }

        svg.selectAll("image.shelf").lower();
    }

    const drawFinalDrink = () => {
        $(".section7show").css("opacity", 1)
        const drinkname = `${menuSelected.drink} 1`;
        const windowHeight = $(window).height();
        const drinkImgHeight = windowHeight - 100;
        const drinkImgWidth = drinkImgHeight * 0.62;
        $("#finalDrink").attr("src", `./img/drinks/${drinkname}.png`);
        $("#finalDrink").css({ "width": drinkImgWidth, "height": drinkImgHeight })
        // $("#finalDrinkSelected").html(menuSelected.drink.toLowerCase());

        if (menuSelected.flavor == "No") {
            $("#finalFlavor").html(`There is no extra flavor added to this drink`);
        } else {
            $("#finalFlavor").html(`The drink has <b>${menuSelected.flavor.toLowerCase()}</b> for an extra tint of complexity.`);
        }
        if (menuSelected.texture == "No") {
            $("#finalTexture").html(`The drink doesn't have any default textures. But toppings include:`);
        } else {
            $("#finalTexture").html(`The drink comes with <b>${menuSelected.texture.toLowerCase()}</b> plus the following toppings: <span id="additionalToppings"></span>`);
        }
        if (menuSelected.milk == "No") {
            $("#finalMilk").html(`There is no milk in this drink`);
        } else {
            $("#finalMilk").html(`The drink has <b>${menuSelected.milk.toLowerCase()}</b>.`);
        }

        if (menuSelected.base1 == "No" || menuSelected.base2 == "No") {
            if (menuSelected.base1 == "No") {
                if (menuSelected.base == "Milk based drinks") {
                    $("#finalBase").html(`The drink collection is <b>${menuSelected.base.toLowerCase()}</b>, the drink base is <b>${menuSelected.drink.toLowerCase()}</b>, with the main base being <b>milk</b>.`);
                }

            } else {
                if (menuSelected.base == "Milk based drinks") {
                    $("#finalBase").html(`The drink collection is <b>${menuSelected.base.toLowerCase()}</b>, the drink base is <b>${menuSelected.drink.toLowerCase()}</b>, with the main bases being <b>milk</b> and <b>${menuSelected.base1.toLowerCase()}</b>`);
                } else {
                    $("#finalBase").html(`The drink collection is <b>${menuSelected.base.toLowerCase()}</b>, the drink base is <b>${menuSelected.drink.toLowerCase()}</b>, with the main base being <b>${menuSelected.base1.toLowerCase()}</b>`);
                }
            }

        } else {
            if (menuSelected.base == "Milk based drinks") {
                $("#finalBase").html(`The drink collection is <b>${menuSelected.base.toLowerCase()}</b>, the drink base is <b>${menuSelected.drink.toLowerCase()}</b>, with the main bases being milk, <b>${menuSelected.base1.toLowerCase()}</b>, and <b>${menuSelected.base2.toLowerCase()}</b>`);
            } else {
                $("#finalBase").html(`The drink collection is <b>${menuSelected.base.toLowerCase()}</b>, the drink base is <b>${menuSelected.drink.toLowerCase()}</b>, with the main base being <b>${menuSelected.base1.toLowerCase()}</b> and <b>${menuSelected.base2.toLowerCase()}</b>`);
            }
        }
        $("#finalMlik").html(menuSelected.milk.toLowerCase());
    }


    const drawDelay = (className, data, dataText, time, viz) => {

        const classNameImg = className + "Img";
        const classNameText = className + "Text";


        if (classNameImg == "level7Img") {
            setTimeout(
                function () {
                    drawImage(classNameImg, dataText)
                }, 500 + delay * 7); //500 instead of 750 so the last images draw about the same time as the tree finishes

        } else {
            drawImage(classNameImg, dataText)
        }


        setTimeout(
            function () {
                if (viz) { drawViz(className, data); }
                drawText(classNameText, dataText)
            }, time);

    }

    const createTree = selected => {

        d3.select("#introText").remove();

        vRoot = arrangeData(selected);
        const vNodes = vRoot.descendants();
        const vLinks = vLayout(vRoot).links();

        const filterData = (targetHeight) => (vLinks.filter(d => d.target.height == targetHeight))
        const filterDataNodes = (targetHeight) => (vNodes.filter(d => d.height == targetHeight))

        const level1Data = filterData(5);
        const level2Data = filterData(4);
        const level3Data = filterData(3);
        const level4Data = filterData(2);
        const level5Data = filterData(1);
        const level6Data = filterData(0); //the actual drinks


        bgData = [
            { "y0": level2Data[0].source.y, "y1": level2Data[0].target.y },
            { "y0": level3Data[0].source.y, "y1": level3Data[0].target.y },
            { "y0": level4Data[0].source.y, "y1": level4Data[0].target.y },
            { "y0": level5Data[0].source.y, "y1": level5Data[0].target.y },
            { "y0": level6Data[0].source.y, "y1": level6Data[0].target.y }];


        drawBG();
        d3.selectAll("path").remove();// so that the old trees don't stay there when a new base is selected

        setTimeout(
            function () {
                drawViz("level1", level1Data);
                g.selectAll("image.topImg").raise(); // so the shaker is on top of the first tree level
            }, 750 + delay); //750 so the shaker animation finishes before the tree draws


        drawDelay("level2", level2Data, level1Data, 750 + delay * 2, true);
        drawDelay("level3", level3Data, level2Data, 750 + delay * 3, true);
        drawDelay("level4", level4Data, level3Data, 750 + delay * 4, true);
        drawDelay("level5", level5Data, level4Data, 750 + delay * 5, true);
        drawDelay("level6", level6Data, level5Data, 750 + delay * 6, true);
        drawDelay("level7", level6Data, level6Data, 750 + delay * 7, false);

        //add top shaker image
        g.selectAll("image.topImg").remove();
        g.append("image").datum(vRoot).attr("class", "topImg")
            .transition().duration(500)
            //only after I add the transition that the shaker animation draws everytime instead of just the first time, why?
            .attr("x", d => d.x - imgWidth / 2)
            .attr("y", d => d.y - 100)
            .attr("width", imgWidth + 20)
            .attr("height", imgWidth + 20)
            .attr("xlink:href", d => `./img/shaker.gif`);
    }


    //selected

    let clicked = false;
    let selected;
    let selectedString;
    let bgData;
    let vRoot;
    let temperature;
    let ice;
    // Get the modal
    let modal = $("#myModal");
    // Get the <span> element that closes the modal
    let closeModal = $("#closeModal");

    $("#menuCaret").on("click", function (event) {
        $("#menuInner").toggleClass("close");
        $("#menuCaret").toggleClass("flip");
    });

    $("#section2 .base").on("click", function (event) {
        event.preventDefault();
        $("#section2 .base").css("background-color", "#f9f8f2");
        $(this).css("background-color", "#fcf2d8");
        // $(`.level7Text:not(#text${menuSelected.drink.replaceAll(" ","_")}7)`).css("font-weight",400);
        d3.selectAll(".level7Text").style("font-weight", 400);
        //d3.select(`#text${menuSelected.drink.replaceAll(" ","_")}7`).style("font-weight",700);
        $("#clickInstruction").css("display", "inherit");
        $("#clickInstruction").css("opacity", 0.7);

        if (!clickDisabled) {
            clickDisabled = true;
            $("#section2 .base").css("opacity", 0.5)
            $("#section2 .basetext").css("opacity", 0.5)
            $("#section2 .base").removeClass("basehover");

            selectedString = $(this).attr("id");
            selected = window[selectedString];
            createTree(selected);

            //if selected base is different
            d3.selectAll("circle.circles").attr("stroke", "none").attr("stroke-width", 0);

            menuSelected.base = $("#" + selectedString).attr("value");
            clicked = true;
        }


        setTimeout(
            function () {
                clickDisabled = false;
                $("#section2 .base").css("opacity", 1)
                $("#section2 .basetext").css("opacity", 1)
                $("#section2 .base").addClass("basehover");
            }, 750 + delay * 7);

    });


    closeModal.on("click", function () {
        modal.css("display", "none");
    });


    //toppings on click
    $("#section3 img").on("click", function (event) {
        event.preventDefault();
        if (menuSelected.drink == "") {
            modal.css("display", "block");
            $("#modalText").html("Select base first");
            return
        }
        $(this).css("background-color", "#fcf2d8");

        let selectedTopping = $(this).attr("id");
        let selectedToppingClean = $(this).parent().find(".toppingsText").text();
        if (menuSelected.toppings.length < 3) {
            if (menuSelected.toppings.indexOf(selectedToppingClean) === -1) {
                menuSelected.toppings.push(selectedToppingClean);
                if (typeof menuSelected.toppings[0] === 'undefined') {
                    $("#topping1").css("display", "none");
                }
                else {
                    $("#topping1").css("display", "inline");
                    $("#topping1").attr("src", `./img/toppings/${menuSelected.toppings[0]}.png`);
                    $("#topping1text").css("display", "inline");
                    $("#topping1text").html(`${menuSelected.toppings[0]}`);
                }
                if (typeof menuSelected.toppings[1] === 'undefined') {
                    $("#topping2").css("display", "none");
                }
                else {
                    $("#topping2").css("display", "inline");
                    $("#topping2").attr("src", `./img/toppings/${menuSelected.toppings[1]}.png`);
                    $("#topping2text").css("display", "inline");
                    $("#topping2text").html(`${menuSelected.toppings[1]}`);
                }
                if (typeof menuSelected.toppings[2] === 'undefined') {
                    $("#topping3").css("display", "none");
                }
                else {
                    $("#topping3").css("display", "inline");
                    $("#topping3").attr("src", `./img/toppings/${menuSelected.toppings[2]}.png`);
                    $("#topping3text").css("display", "inline");
                    $("#topping3text").html(`${menuSelected.toppings[2]}`);
                }

                $("#toppings").html(menuSelected.toppings.join(", "));
                $("#" + selectedTopping).parent().append(`<div class='iconSelectWrapper' id='${selectedTopping}Select'><div class='iconSelect selected'>+</div></div></div>`)
            }
        } else {
            modal.css("display", "block");
            $("#modalText").html("Please select up to <b>three ingredients</b> only for a more balanced tasting experience.");
            $(`#${selectedTopping}.toppings`).css("background-color", "#f9f8f2");
        }


        $(".iconSelect").on("click", function (event) {
            event.preventDefault();
            let removedTopping = $(this).parent().parent().find(".toppingsText").text();
            let removedToppingId = removedTopping.replace(/\s/g, '').toLowerCase();
            $(`#${removedToppingId}.toppings`).css("background-color", "#f9f8f2");
            const index = menuSelected.toppings.indexOf(removedTopping);
            if (index > -1) {
                menuSelected.toppings.splice(index, 1);
            }
            $("#toppings").html(menuSelected.toppings.join(", "));
            $("#additionalToppings").html(menuSelected.toppings.join(", "));
            $(this).remove();

            if (typeof menuSelected.toppings[0] === 'undefined') {
                $("#topping1").css("display", "none");
                $("#topping1text").css("display", "none");
                $("#topping2").css("display", "none");
                $("#topping2text").css("display", "none");
                $("#topping3").css("display", "none");
                $("#topping3text").css("display", "none");
            }

            if (typeof menuSelected.toppings[1] === 'undefined') {
                $("#topping2").css("display", "none");
                $("#topping3").css("display", "none");
                $("#topping2text").css("display", "none");
                $("#topping3text").css("display", "none");
            }

            if (typeof menuSelected.toppings[2] === 'undefined') {
                $("#topping3").css("display", "none");
                $("#topping3text").css("display", "none");
            }

        });

    });

    $("#section3 img").on("mouseover", function (event) {
        const id = $(this).attr('id');
        $(`#section3 .tooltiptext#${id}1`).css("visibility", "visible")
    }).on("mouseout", function (event) {
        const id = $(this).attr('id');
        $(`#section3 .tooltiptext#${id}1`).css("visibility", "hidden")
    })


    document.getElementById('sliderIce').addEventListener('input', function (e) {
        const sliderVal = +e.target.value;
        $("#temperature").html(`${temperatureScale(sliderVal)}`);
        $(".temp_img").removeClass("tempSelected");
        $(".tempText").removeClass("tempSelected");
        $(`#temp${sliderVal}img`).addClass("tempSelected");
        $(`#temp${sliderVal}text`).addClass("tempSelected");
        $("#tempSelected").css("display", "inline");
        $("#tempSelected").attr("src", `./img/temp/${temperatureScale(sliderVal)}.png`);
        $("#tempSelectedText").css("display", "inline");
        $("#tempSelectedText").html(`${temperatureScale(sliderVal)}`);
    }); //end slider input

    document.getElementById('sliderIce').addEventListener('mouseover', function (e) {
        $("#sliderIce").css("height", 6)
        $("#sliderIce").css("cursor", "pointer")
    });

    document.getElementById('sliderIce').addEventListener('mouseout', function (e) {
        $("#sliderIce").css("height", 4)
        $("#sliderIce").css("cursor", "pointer")
    });

    document.getElementById('sliderSweet').addEventListener('input', function (e) {
        const sliderVal = +e.target.value;
        $("#sweetness").html(`${sweetnessScale(sliderVal)}%`);
        $(".sweet_img").removeClass("sweetSelected");
        $(".sweetText").removeClass("sweetSelected");
        $(`#sweet${sliderVal}img`).addClass("sweetSelected");
        $(`#sweet${sliderVal}text`).addClass("sweetSelected");
        $("#sweetSelected").css("display", "inline");
        $("#sweetSelected").attr("src", `./img/sweet/Sugar-${sweetnessScale(sliderVal)}.png`);
        $("#sweetSelectedText").css("display", "inline");
        $("#sweetSelectedText").html(`${sweetnessScale(sliderVal)}%`);
    }); //end slider input

    document.getElementById('sliderSweet').addEventListener('mouseover', function (e) {
        $("#sliderSweet").css("height", 6)
        $("#sliderSweet").css("cursor", "pointer")
    });

    document.getElementById('sliderSweet').addEventListener('mouseout', function (e) {
        $("#sliderSweet").css("height", 4)
        $("#sliderSweet").css("cursor", "pointer")
    });

    $("#sectionStraw img").on("click", function (event) {
        event.preventDefault();

        $("#sectionStraw img").css("background-color", "white");
        $(this).css("background-color", "#fcf2d8");

        let selectedStrawText = $(this).parent().find(".strawText").text();
        menuSelected.straw = selectedStrawText;
        $("#straw").html(` ${menuSelected.straw}`);
        if (menuSelected.straw == "I brought my own") {
            $("#finalStraw").html("You brought your own reusable straw. Thanks for doing your part to help the planet!");
        } else if (menuSelected.straw == "Wide boba straw") {
            $("#finalStraw").html("You chose a wide boba straw to enjoy your toppings.");
        } else {
            $("#finalStraw").html("You chose a regular straw.");
        }
    });

    $("#sectionBag img").on("click", function (event) {
        event.preventDefault();

        $("#sectionBag img").css("background-color", "white");
        $(this).css("background-color", "#fcf2d8");

        let selectedBagText = $(this).parent().find(".bagText").text();
        menuSelected.bag = selectedBagText;

        $("#bag").html(`, ${menuSelected.bag == "I brought my own" ? menuSelected.bag : menuSelected.bag.toLowerCase()}`);
        if (menuSelected.bag == "I brought my own") {
            $("#finalBag").html("You brought your own. Thanks for doing one small step to save the planet.");
        } else if (menuSelected.bag == "No bag") {
            $("#finalBag").html("You didn't take a bag. Thanks for doing one small step to save the planet.");
        } else {
            $("#finalBag").html("You took a bag.");
        }
    });



    const flatten = root => {
        const nodes = [];
        let i = 0;

        function recurse(node) {
            if (node.children) node.children.forEach(recurse);
            if (node._children) node._children.forEach(recurse);
            if (!node.id) node.id = ++i;
            nodes.push(node);
        }

        recurse(root);
        return nodes;
    }


    const update = source => {

        d3.selectAll("path.path").style("stroke", function (d) {

            if (d.target.color) {
                return d.target.color
            } else {
                return colorScale(d3.select(this).attr("class"))
            }
        })

        d3.selectAll("path.path").style("stroke-width", function (d) {

            if (d.target.stroke) {
                return +d.target.stroke
            } else {
                // strokeScale(d3.select(this).attr("class"))
                return 3
            }
        })

    }

    const doReset = () => {
        flatten(vRoot).forEach(function (d) {
            //console.log(d)
            d.color = undefined;
            d.stroke = undefined;
        })
        update(vRoot);
    }

}