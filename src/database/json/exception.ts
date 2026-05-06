export class JsonStorageException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JsonStorageException'
  }
}

export class DuplicateTemplateException extends JsonStorageException {
  constructor(message: string) {
    super(message)
    this.name = 'DuplicateTemplateException'
  }
}
