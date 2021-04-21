const express=require('express');
const axios=require('axios');
const fs=require('fs');
const path=require('path');
const { request } = require('express');
const port = 5000;
var app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let procitajPogledZaNaziv=(naziv)=>{
    return fs.readFileSync(path.join(__dirname+"/views/"+naziv+".html"),"utf-8")
}
app.get("/",function(req,res){
    res.send(procitajPogledZaNaziv("index"));
});
function vratiProizvode(){
    return axios.get("http://127.0.0.1:3000/sviproizvodi");
}
function vratiKategorije(){
    return axios.get("http://127.0.0.1:3000/sveKategorije");
}
function prikaziProizvode(proizvodi){
    let prikaz="";
    for(let i=0;i<proizvodi.length;i++){
        prikaz+=`<tr>
        <td>${proizvodi[i].id}</td>
        <td>${proizvodi[i].naziv}</td>
        <td>${proizvodi[i].kategorija}</td>
        <td>${proizvodi[i].cena}</td>
        <td>${proizvodi[i].tekst}</td>           
         <td><table>`;
        
             prikaz+=`<tr><td>${proizvodi[i].oznake}</td> </tr>`
          
        prikaz+=`</table></td><td><table>`;

        if(proizvodi[i].akcije!=undefined){
        for(let j=0;j<proizvodi[i].akcije.length;j++)
            {
             prikaz+=`<tr>
             <td>Cena:${proizvodi[i].akcije[j].nova_cena}
            Datum isteka:${proizvodi[i].akcije[j].datum_isteka}</td> </tr>`; 
            }  
        }
        prikaz+=`</table></td>
        <td><a href="/obrisi/${proizvodi[i].id}">Obrisi</a></td>
        <td><a href="/izmeni/${proizvodi[i].id}">Izmeni</a></td>
        </tr>`;    
        }
        return prikaz;
}
function prikaziKategorije(kategorije){
    prikaz="";
    for(let i=0;i<kategorije.length;i++){
        prikaz+=`<option value='${kategorije[i]}'>${kategorije[i]}</option>`;
      }
      return prikaz;
}
app.get("/sviProizvodi",(req,res)=>{   
    Promise.all([vratiProizvode(), vratiKategorije()])
    .then(function (results) {
        res.send(procitajPogledZaNaziv("sviproizvodi").replace("#{kat}",prikaziKategorije(results[1].data)).replace("#{data}",prikaziProizvode(results[0].data)));
        }).catch(error => {
        console.log(error);
        });
        
        //res.end();
      });

    app.post("/filtrirajPoImenu",(req,res)=>{
        Promise.all([axios.get(`http://127.0.0.1:3000/filtrirajPoImenu?ime=${req.body.ime}`), vratiKategorije()])
        .then(function (results) {
              res.send(procitajPogledZaNaziv("sviproizvodi").replace("#{kat}",prikaziKategorije(results[1].data)).replace("#{data}",prikaziProizvode(results[0].data)));
        }).catch(error => {
            console.log(error);
        });
            
    });
    app.post("/filtrirajPoKategoriji",(req,res)=>{    
        Promise.all([axios.get(`http://127.0.0.1:3000/filtrirajPoKategoriji?kategorija=${req.body.kategorija}`), vratiKategorije()])
        .then(function (results) {
              res.send(procitajPogledZaNaziv("sviproizvodi").replace("#{kat}",prikaziKategorije(results[1].data)).replace("#{data}",prikaziProizvode(results[0].data)));
        }).catch(error => {
            console.log(error);
    });
});
    app.get("/proizvodiNaAkciji",(req,res)=>{
        Promise.all([axios.get(`http://127.0.0.1:3000/proizvodiNaAkciji`), vratiKategorije()])
        .then(function (results) {
              res.send(procitajPogledZaNaziv("sviproizvodi").replace("#{kat}",prikaziKategorije(results[1].data)).replace("#{data}",prikaziProizvode(results[0].data)));
        }).catch(error => {
            console.log(error);
    });
    });

    app.get("/dodajProizvod",function(req,res){
       vratiKategorije().then(response=>{
          res.send(procitajPogledZaNaziv("dodaj").replace("${kat}",prikaziKategorije(response.data)));
       }).catch(error => {
        console.log(error);
});
       
    });
    app.post("/snimiProizvod",(req,res)=>{
        axios.post("http://localhost:3000/dodajProizvod",{
            kategorija:req.body.kategorija,
            naziv:req.body.naziv,
            cena:req.body.cena,
            tekst:req.body.tekst,
            oznake:req.body.oznake,
            nova_cena:req.body.nova_cena,
            datum_isteka:req.body.datum_isteka
            
        }).catch(error => {
            console.log(error);        
    });
    res.redirect("/sviProizvodi"); 
    });
    app.get("/obrisi/:id",(req,res)=>{
        axios.delete(`http://localhost:3000/izbrisiProizvod/${req.params["id"]}`)
        res.redirect("/sviProizvodi");
    });
    app.get("/izmeni/:id",function(req,res){
        
        Promise.all([axios.get(`http://localhost:3000/vratiProizvod/${req.params.id}`),vratiKategorije()])
        .then(function (results) {
            let akcije="";
            for(let i=0;i<results[0].data.length;i++){
                if(results[0].data[i].akcije!=undefined){
                for(let j=0;j<results[0].data[i].akcije.length;j++){
                    akcije+=`Nova cena:<input type="number" name="nova_cena" value="${results[0].data[i].akcije[j].nova_cena}"><br><br>
                    Datum isteka:<input type="text" name="datum_isteka" value="${results[0].data[i].akcije[j].datum_isteka}"> `
                }
            }
            }
              res.send(procitajPogledZaNaziv("izmeni").replace("${kat}",prikaziKategorije(results[1].data)).replace("${id}",results[0].data[0].id).replace("${naziv}",results[0].data[0].naziv).replace("${cena}",parseFloat(results[0].data[0].cena)).replace("${tekst}",results[0].data[0].tekst).replace("${oznake}",results[0].data[0].oznake).replace("${akcije}",akcije));
        }).catch(error => {
            console.log(error);
    });
    });
app.post("/snimiIzmene",function(req,res){
axios.post("http://localhost:3000/snimiIzmene",{
    id:req.body.id,
    kategorija:req.body.kategorija,
    naziv:req.body.naziv,
    cena:req.body.cena,
    tekst:req.body.tekst,
    oznake:req.body.oznake,
    nova_cena:req.body.nova_cena,
    datum_isteka:req.body.datum_isteka
}).catch(error => {
    console.log(error);        
});
res.redirect("/sviProizvodi"); 
});

app.listen(port,()=>{console.log(`startovan klijent na portu ${port}`)});




