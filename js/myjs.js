const allUrl = 'https://api.coingecko.com/api/v3/coins/list';
const searchUrl = 'https://api.coingecko.com/api/v3/coins/'; //{id}
const testUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=USD&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h';

let coins = [];
let chosenCoins = [];
$(async()=>{
    
    //get 100 most popular coins. to get all coins in the api - replace "testUrl" with "allUrl" 
    coins = await $.get(testUrl);
    buildCards(coins);

    $('.home').on("click",()=>{
        buildCards(coins);
    });

    //activate the search if click or press enter
    $('.search').on("click", ()=> {searchCoin()});
    $('#searchBox').keypress((event)=>{
        let keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            searchCoin();  
        }
    });

    $('.about').on("click",about);
    $('.closeModal').on("click", ()=>{$('#replaceCoinModal').modal('hide');} )

    //delete the cache even when refreshing the page before the delete function activates.
    $(window).on('beforeunload', ()=>{caches.delete("myCache")}) 
})

const buildCards = (coinsList) => {
    progressBar('cardsContainer');
    let result = ''
    coinsList.map((item)=>{
        result += `
        <div class="card m-2">
            <div class="card-body" style="width:100%">
                <div class="d-flex flex-row justify-content-between">
                    <div>
                        <h5 class="card-title">${item.symbol.toUpperCase()}</h5>
                        <p class="card-text">${item.id}</p>
                        <input type="button" class="btn btn-primary infoBtn" onclick="moreInfo('${item.id}')" value="more info"/>
                    </div>
                    <div class="form-check form-switch">
                        <input type="checkbox" class="form-check-input" role="switch" id="${item.symbol.toUpperCase()}" onclick="handleToggle(this)"/>
                    </div>
                </div>
                <div class="collapse m-2" id="${item.id}"></div>
            </div>
        </div>
        `
    });
    $('.cardsContainer').html(result);

    // check coin boxs if already selected.
    if(chosenCoins.length>0){
        chosenCoins.map(item=>$('#'+item).prop("checked",true))
    }
}

const searchCoin = async () => {
    progressBar('cardsContainer');
    let coinId =  $('#searchBox').val();
    let searched = coins.find(item=>item.id == coinId);
    searched ? buildCards([searched]) : buildCards([]);
}

const moreInfo = (id) => {

    // if clicked to hide:
    if($(`#${id}`).hasClass("show")){
        $(`#${id}`).collapse('toggle');
        return
    
    // if clicked to show:
    }else{
        progressBar(id);
        $(`#${id}`).collapse('toggle');
        caches.open('myCache')
        .then(cache=>{return cache.match(id)})
        .then(response =>{
            
            // if there is no data about this coin in the cache
            if(! response){
                let info
                $(async()=>{
                    info = await $.get(searchUrl+id)
        
                    let result = `<br/><div class="coinDataBox">
                    <div><img class="coinImg" src="${info.image.small}"/></div><br/>
                    <div>
                    USD value: ${info.market_data.current_price.usd.toLocaleString()} $<br/>
                    EUR value: ${info.market_data.current_price.eur.toLocaleString()} €<br/>
                    ILS value: ${info.market_data.current_price.ils.toLocaleString()} ₪
                    </div>
                    </div>`;
        
                    // saving in cache without plugin
                    caches.open('myCache')
                    .then((cache)=>{
                        let response = new Response(JSON.stringify(result));
                        cache.put(id, response)});
                    
                    $('#'+id).html(result);

                    //deleting after 2 minutes.
                    setTimeout(()=>{
                        caches.open('myCache')
                        .then((cache)=>
                            cache.delete(id)
                        )
                    },1000*60*2);
                });

            //if there is already data about the coin in cache
            }else{ 
                caches.open('myCache').then((cache)=>{
                    cache.match(id).then((response)=>{
                        response.json().then((data)=>{
                            $('#'+id).html(data);
                            })
                        })
                        })
            }
        });
    }     
}

const progressBar = (divId) => {
    let progressBar = $(`
        <div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>`)
    $('#'+divId).html(progressBar)
}

const handleToggle = (inputObj) => {

    //try add the coin
    if(inputObj.checked){ 

        //there is no space
        if(chosenCoins.length>=5){ 
            $(inputObj).prop("checked",false)
            fullList(inputObj);
        
        //there is space
        }else{chosenCoins.push(inputObj.id)}

    //try remove the coin
    }else{
        chosenCoins = chosenCoins.filter(item=> item!=inputObj.id)
    }
}

const fullList = (newPickObj) => {
    let chosenCoinsData = ''
    chosenCoins.map(item=>{
        chosenCoinsData += `
            <div class="replaceCoinBox">
                <input type="radio" name="remove" id="${item}" value="${item}"/>
                <label for="${item}">${item}</label>
            </div>
        `
    })
    $('#chosenCoinsData').html(chosenCoinsData);
    $('#replaceCoinModal').modal('show');
    $('.replacePickForm').submit((event)=>{
        
        // prevent form from submitting
        event.preventDefault();
        let selectedValue = $('input[name=remove]:checked').val();
        if (!selectedValue){return};

        // replace on the card container
        $('#'+selectedValue).prop("checked",false);
        $(newPickObj).prop("checked",true)

        // replace on the reports list
        chosenCoins = chosenCoins.filter(item=>item!=selectedValue);
        chosenCoins.push(selectedValue);

        $('#replaceCoinModal').modal('hide');
    })
}

const about = () => {
    let aboutContent = `
    <div class="about p-4";>
        <h2>About Me</h2>
        <img class="m-4 mx-auto" src="./img/myPicture.jpg" width="500"/>
        <p><h6>Hi, my name is Tzvi Houminer.</h6>I am the developer of this project.<br/>
        I'm a student in the FullStack Web development course in JohnBryce academy.</p>
        <h2>About the Project</h2>
        <p>the purpose of my project is to provide accessible and easy-to-understand information about the current value of cryptocurrencies in a way that is convenient for the average user. </p>
        <br/>
        <p>Feel free to check out my LinkedIn profile and GitHub repositories for more information about my work:
        <br/><br/>
        LinkedIn: <a href="https://www.linkedin.com/in/tzvi-houminer/">www.linkedin.com/in/tzvi-houminer/</a><br/>
        GitHub: <a href="https://github.com/TzviHouminer">www.github.com/TzviHouminer</a></p>
    </div>
    `;
    $('.cardsContainer').html(aboutContent);
}