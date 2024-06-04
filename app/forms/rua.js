var axios = require('axios');   
const fs = require('fs');
const { spawn } = require('child_process');
const FormData = require('form-data');


const padImage = (inPath, outPath) => {

    return new Promise((resolve, reject) => {

        const ffmpegArgs = [
            '-y',
            '-i', inPath,
            '-vf', 'scale=iw*min(1500/iw\\,1000/ih):ih*min(1500/iw\\,1000/ih),pad=1500:1000:(1500-iw*min(1500/iw\\,1000/ih))/2:(1000-ih*min(1500/iw\\,1000/ih))/2:color=#fefaed',
            outPath
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegArgs);

        ffmpeg.on('error', (error) => {
            console.error('Error running ffmpeg:', error);
            reject(error);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0){
                console.log('ffmpeg process completed successfully.');
                resolve();
            }
            else{
                reject(new Error(`ffmpeg process exited with code ${code}`));
            }
        });
    });
};


const postImagem = async (multerFile,subst,route) => {

    try {

        let outPath = multerFile.path + '.' + multerFile.originalname.split('.').pop()
        await padImage(multerFile.path,outPath)
        const data = fs.readFileSync(outPath)
        const formData = new FormData()

        formData.append('imagem', data, multerFile.originalname)
        formData.append('subst', subst);

        const response = await axios.post(`http://localhost:3000/${route}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }})

        fs.unlinkSync(multerFile.path)
        fs.unlinkSync(outPath)

        return response.data
    }

    catch (error){
        console.log(error)
        return -1
    }
};


module.exports.deleteImageIfNotContains = async (past,now,route) => {

    for (past_element of past){
        var contains = false
        for (var index = 0; index < now.length && !contains; index++){
            if (past_element['_id'] == now[index]['_id']){
                contains = true
            }
        }
        if (!contains){
            console.log('A eliminar: ' + past_element['_id'])
            axios.delete(`http://localhost:3000/${route}/${past_element['_id']}`)
        }
    }
}


module.exports.postImagensAntigas = async (req) => {

    var ids = []

    if (req.files.oldImageFiles){

        if (req.body.oldImageSubst && !Array.isArray(req.body.oldImageSubst)){
            req.body.oldImageSubst = [req.body.oldImageSubst]
        }

        var baseIndex = req.body.oldImageSubst.length - req.files.oldImageFiles.length

        for (let index = 0; index < req.files.oldImageFiles.length; index++){
            let id = await postImagem(
                req.files.oldImageFiles[index],
                req.body.oldImageSubst[baseIndex + index],
                'antigo')
            ids.push({_id: id['_id']})
        }
    }

    return ids
}


module.exports.postImagensAtuais = async (req) => {

    var ids = []

    if (req.files.newImageFiles){

        if (req.body.newImageSubst && !Array.isArray(req.body.newImageSubst)){
            req.body.newImageSubst = [req.body.newImageSubst]
        }

        var baseIndex = req.body.newImageSubst.length - req.files.newImageFiles.length

        for (let index = 0; index < req.files.newImageFiles.length; index++){
            let id = await postImagem(
                req.files.newImageFiles[index],
                req.body.newImageSubst[baseIndex + index],
                'atual')
            ids.push({_id: id['_id']})
        }

    }

    return ids
}



module.exports.getRuaForm = (req) => {
    
    var formData = {
        name: req.body.name,
        description: req.body.description.split('\r\n'),
        dates: [],
        places: [],
        entities: [],
        houses: [],
        old_images: [],
        new_images: []
    }

    if (req.body.dates)
        formData.dates = (Array.isArray(req.body.dates))
            ? req.body.dates : [req.body.dates]; 

    if (req.body.places)
        formData.places = (Array.isArray(req.body.places))
            ? req.body.places : [req.body.places]; 

    if (req.body.entities)
        formData.entities = (Array.isArray(req.body.entities))
            ? req.body.entities : [req.body.entities];

    if (Array.isArray(req.body.enfiteuta)){
        for (let index = 0; index < req.body.enfiteuta.length; index++){
            formData.houses.push({
                enfiteuta: req.body.enfiteuta[index],
                subst: req.body.subst[index],
                vista: req.body.vista[index],
                desc: req.body.desc[index].split('\r\n')
            })
        }
    }

    if (req.body.enfiteuta && !Array.isArray(req.body.enfiteuta)){
        formData.houses.push({
            enfiteuta: req.body.enfiteuta,
            subst: req.body.subst,
            vista: req.body.vista,
            desc: req.body.desc.split('\r\n')
        })
    }

    if (Array.isArray(req.body.oldImageFiles)){
        for (let index = 0; index < req.body.oldImageFiles.length; index++){
            formData.old_images.push({_id: req.body.oldImageFiles[index]})
        }
    }

    if (req.body.oldImageFiles && !Array.isArray(req.body.oldImageFiles)){
        formData.old_images.push({_id: req.body.oldImageFiles})
    }


    if (Array.isArray(req.body.newImageFiles)){
        for (let index = 0; index < req.body.newImageFiles.length; index++){
            formData.new_images.push({_id: req.body.newImageFiles[index]})
        }
    }

    if (req.body.newImageFiles && !Array.isArray(req.body.newImageFiles)){
        formData.new_images.push({_id: req.body.newImageFiles})
    }

    return formData
}