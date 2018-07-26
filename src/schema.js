class Schema {
    constructor(rules) {
        this.rules = rules;
    }
    
    validate(value) {
        for (let rule of this.rules) {
            const tokens = rule.split('.');
            const validateRule = (tokenIndex, current) => {
                const token = tokens[tokenIndex];
                const isOptional = token.endsWith('?');
                if (isOptional) token.slice(0, -1);

                const isArray = token.endsWith('[]');
                if (isArray) token.slice(0, -2);

                if (isOptional && current === undefined) return;
                if (current === undefined) throw `token #${tokenIndex} of rule '${rule}' failed`;
                if (tokenIndex === tokens.length - 1) return;
                if (isArray) {
                    if (!Array.isArray(current)) throw `token #${tokenIndex} of rule '${rule}' failed`;
                    for (let element of current) {
                        validateRule(tokenIndex + 1, element);
                    }
                } else {
                    validateRule(tokenIndex + 1, current[token]);
                }
            };
            validateRule(0, value);
        }
    }
}

/*class ValidationResult {
    constructor(message) {
        if (message === undefined) {
            this.success = true;
        } else {
            this.success = false;
            this.message = message;
        }   
    }

    throwIfFailure() {
        if (!this.success) {
            throw this;
        }
    }
}*/

module.exports = Schema;
//module.exports.ValidationResult = ValidationResult;
