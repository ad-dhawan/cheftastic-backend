res.write(`<!DOCTYPE html>
    <html>
    <head>
    <title>Cheftastic</title>
    <style>
    *{
       
       margin: 0;
       padding: 0;
    }
    
    .Nav{
       background: white;
       padding: 15px;
       display: flex;
       justify-content: space-between;
       position: relative;
       align-items: center;
    }
    
    .navlist ul{
        display: flex;
    }

    .navlist li{
        list-style: none;
        margin: 0rem 1rem;
    }

    .navlist li a{
        text-decoration: none;
    }

    .nav-content{
       
       font-size: 2rem;
       text-decoration: none;
       color: red;
       padding-left: 1rem;
    
    }
    
    .main-contanier{
       width: 60%;
       margin: auto;
       margin-top: 1rem;
       background: white;
    
    
    }
    
    .content{
       margin: 1rem 2rem;
    }
    
    
    .content h2{
       margin: 1rem 0rem;
       font-size: 2.5rem;
    
    }
    
    .content-img{
       height: 30rem;
       width: 100%;
       overflow: hidden;
    }
    
    .content-img .btn{
       position: absolute;
       left: 23%;
       top: 30rem;
       font-size: 3rem;
       color: white;
    }
    
    
    .content-img img{
       width: 100%;
       height: 60rem;
    
    }
    
    .content{
       margin: 0rem 1.5rem;
       margin-bottom: 2.5rem;
    
    }
    
    .info-item{
       display: flex;
    
    }
    
    .creater{
       position: relative;
       margin: 0rem 10px;
       margin-right: auto;
    
    }
    
    .meal_type{
    
       display: flex;
       align-items: center;
    }
    
    .meal_type img{
       margin-right: .5rem;
    
    }
    
    .avatar img{
       height: 2.5rem;
    
    }
    
    
    .name{
       margin: 0.5rem 0rem;
       font-size: 1.5rem;
    }
    
    .extra-info{
       display: flex;
    
    }
    
    .kcal{
    
       font-size: 1.5rem;
       padding-bottom: 0.4rem;
       color: #388ce0;
    
    }
    
    .start{
    
       font-size: 1.5rem;
       padding-bottom: 0.4rem;
       color: #efd600fc;
    
    }
    
    .time{
       font-size: 1.5rem;
       padding-bottom: 0.4rem;
       color: #0ac60a;
    
    }
    
    hr{
       width: 50%;
       margin: auto;
    }
    
    .ingredients{
       text-align: center;
       color: red;
       font-size: 1.5rem;
       margin: 1rem 0rem;
    
    }
    
    li{
       color: orange;
       font-size: 1.2rem;
       margin-bottom: 1rem;
    
    
    }
    
    li span{
       color: black;
    }
    
    .instructions{
       text-align: center;
       color: red;
       font-size: 1.5rem;
       margin: 1rem 0rem;
    
    }
    
    .info-1{
       display: flex;
       margin: 0rem 1rem;
       flex-direction: column;
       align-items: center;
       background: #aedcf6;
       padding: 1.5rem 1rem;
       width: 3.5rem;
       border-radius: 10px;
       color: #388ce0;
    
    
    
    }
    .info-2{
       display: flex;
       margin: 0rem 1rem;
       flex-direction: column;
       align-items: center;
       background: #fff6ae;
       padding: 1.5rem 1rem;
       width: 3.5rem;
       border-radius: 10px;
       color: #efd600fc;
    
    
    }
    .info-3{
       display: flex;
       margin: 0rem 1rem;
       flex-direction: column;
       align-items: center;
       background: #a4f6a7;
       padding: 1.5rem 1rem;
       width: 3.5rem;
       border-radius: 10px;
       color: #0ac60a;
    
    }
    
    .info-credit{
       width: 80%;
       margin: auto;
    }
    </style>
    <script src="https://kit.fontawesome.com/9ebcbc9e58.js" crossorigin="anonymous"></script>
    </head>
    <body style=" background: #eeee;">
        <!---------------------- Navbar starting------------------ -->
        <nav class="Nav">
            <div class="Navbar" >
              <a class="nav-content" href="#">Cheftastic</a>
            </div>
        </nav>
        
        <!------------------Main Container-------------------->
        <section class="main-contanier">
            <!--Img-->
            <section class="content-img">
                <img src="post.image_url" alt="">
                <a href="${post.meal_video_url}"><i class="btn fa-regular fa-circle-play"></i></a>
            </section>
            <!--Info-->
            <section class="content">
                <h2>
                    ${post.meal_name}
                </h2>
                <section class="info-item">
                    <div class="avatar">
                        <img src="post.user_avatar" alt="">
                        
                    </div>
                    <section class="creater">
                        <div class="creater-name">
                            <div class="name">
                                ${post.user_name}
                            </div>
                            <div class="meal_type"> 
    
                                <img src="https://img.icons8.com/ios-glyphs/30/000000/non-vegetarian-food-symbol.png"/>
                                <div>
                                    ${post.meal_type}
                                </div>
                            </div>
                        </div>
                    </section>
                    <section class="extra-info">
                        <div class="info-1">
                            <i class="kcal fa-solid fa-fire-flame-curved"></i>
                            ${post.meal_calories}
                        </div>
                        <div class="info-2">
                            <i class="start fa-solid fa-star"></i>
                            ${post.meal_difficulty}
                        </div>
                        <div class="info-3">
                            <i class="time fa-solid fa-clock-rotate-left"></i>
                            ${post.meal_cooking_time}
                        </div>
                    </section>
                </section>
            </section>
            <hr>
            <section class="info-credit">
            <!--Ingredients-->
            <section>
            <div class="ingredients">
                Ingredients
            </div>`)
    for(let i=0 ; i<post.ingredients.length; i++){
        res.write(`
        <div>
            <ul>
                <li>
                    <span>
                        ${post.ingredients[i]}
                    </span>
                </li>
            </ul>
        </div>`)
    }        
    res.write(`
            </section>
            <!--Instructions-->
            <section>
                <div class="instructions">
                    Instructions
                </div>`)
    for(let j=0; j<post.recipe.length; j++){
    res.write(`
                <div>
                    <ul>
                        <li>
                            <span>
                            ${post.recipe[j]}
                            </span> 
                        </li>
                    </ul>
                </div>`)
    }
    res.write(`</section>
            </section>
        </section>
    
    
    
    </body>
    </html>`)