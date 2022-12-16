class GUIHandler{
    constructor(callbackOptions, callbackStart){
    
        this.frameSlider=document.getElementById("freeFrames")
        this.frameOutput = document.getElementById("freeFramesOutput")

        this.pagesSlider=document.getElementById("pages")
        this.pagesOutput = document.getElementById("pagesOutput")

        this.startButton=document.getElementById("start")
        let update = () =>{
            this.frameOutput.innerHTML = this.frameSlider.value;
            this.pagesOutput.innerHTML = this.pagesSlider.value;
            callbackOptions(this.frameSlider.value, this.pagesSlider.value)
        } 

        this.frameSlider.addEventListener('input', update);
        this.pagesSlider.addEventListener('input', update);
        this.startButton.addEventListener('click', callbackStart);

        update();
    }
    
}
export {GUIHandler}