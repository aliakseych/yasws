import fs from "node:fs/promises"
import ejs from "ejs"

import { HTMLResponse } from "./responses.js"
import { addEndSlash } from "../server/helpers.js"
import type { Middleware } from "../server/middleware.js"
import type { Request } from "../server/request.js"

export { Templater, TemplaterMiddleware, LoadStrategy }

enum LoadStrategy {
    // Reading template files on each request
    ROR = "readOnRequest",
    // Uploads files from folder to memory on start, and reads from it
    UTR = "uploadToRam"
}

class Templater {
    basePath: string
    loadStrategy: LoadStrategy
    templateFiles: {[key: string]: string} = {}

    constructor (templatesFolder: string, loadStrategy: LoadStrategy = LoadStrategy.UTR) {
        this.basePath = addEndSlash(templatesFolder)
        this.loadStrategy = loadStrategy
        
        this.checkPath()
    }

    private async checkPath() {
        var files

        // Checks that path exists, and load templates if needed
        try {
            files = await fs.readdir(this.basePath)
        } catch (err) {
            throw Error(`Error reading templates directory ${this.basePath}: ${err}`)
        }

        // If load strategy is set to Upload To Memory: read all files and 
        // add them to templates list
        if (this.loadStrategy == LoadStrategy.UTR) {
            for (const filename of files) {
                const templatePath = `${this.basePath}${filename}`
                this.templateFiles[filename] = await fs.readFile(templatePath, "utf-8")
            }
        }
    }

    public async renderHTML(templateFilename: string, args: {[key: string]: any}): Promise<HTMLResponse> {
        var templateString: string | undefined

        // If load strategy is set to reading from the memory - use internal variable
        // Else - read from file
        if (this.loadStrategy == LoadStrategy.UTR) {
            templateString = this.templateFiles[templateFilename]
        } else {
            const templatePath = `${this.basePath}${templateFilename}`
            try {
                templateString = await fs.readFile(templatePath, "utf-8")
            } catch (err) {
                throw Error(`Error reading template from ${templatePath}: ${err}`)
            }
        }

        // Check if template isn't undefined
        if (!templateString) {
            throw Error(`Template "${templateFilename}" doesn't exists`)
        }

        // Rendering the template and making the return
        const renderedTemplate: string = ejs.render(templateString, args)
        const response: HTMLResponse = new HTMLResponse(renderedTemplate)

        return response
    }
}

class TemplaterMiddleware extends Templater implements Middleware  {
  constructor (templatesFolder: string, loadStrategy?: LoadStrategy) {
    super(templatesFolder, loadStrategy)
  }

  public call(request: Request): Request {
    // Passing some argument to request, which was given in Middleware constructor
    request.args.templater = this
    return request
  }
}
