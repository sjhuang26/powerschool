class Schema {
	constructor(ruleString, types) {
		this.ruleString = ruleString;
		this.rules = ruleString.split('\n').map((element) => element.trim()).filter((element => element !== ''));
		this.types = types || {};
	}

	compose(newSchema) {
		return new Schema(this.ruleString + '\n' + newSchema.ruleString);
	}
    
	validate(value) {
		for (let rule of this.rules) {
			const tokens = rule.split(' ');
			const validateRule = (tokenIndex, current) => {
				//console.log('REC', tokenIndex, current);
				let token = tokens[tokenIndex];
				// PARSE TOKEN
				const isPropagated = !token.endsWith(':');
				if (!isPropagated) token = token.slice(0, -1);

				const isOptional = token.endsWith('?');
				if (isOptional) token = token.slice(0, -1);

				const isArray = token.endsWith('[]');
				if (isArray) token = token.slice(0, -2);

				const splitTokens = token.split('=');
				let leftToken = splitTokens[0];
				let rightToken = splitTokens[1];

				if (leftToken === '') {
					leftToken = undefined;
				}
				if (rightToken === '') {
					rightToken = undefined;
				}

				// PARSE VALUE
				const leftValue = this.parseValue(current, leftToken);
				if (this.parseValue === undefined) {
					if (isOptional) {
						return;
					} else {
						throw new Error(`failed parse value step at rule ${rule}, token index ${tokenIndex}, current value ${JSON.stringify(current)}`);
					}
				}

				// PARSE IF VALUE IS EQUAL
				if (!this.parseEqual(leftValue, rightToken)) {
					if (isOptional) {
						return;
					} else {
						throw new Error(`failed parse equal step at rule ${rule}, token index ${tokenIndex}, current value ${JSON.stringify(current)}`);
					}
				}

				// PROPAGATE TO NEXT RULE
				if (tokenIndex === tokens.length - 1) return;
				if (!isPropagated) {
					validateRule(tokenIndex + 1, current);
				} else if (isArray) {
					if (!Array.isArray(leftValue)) {
						if (isOptional) {
							return;
						} else {
							throw new Error(`failed array propagation step at rule ${rule}, token index ${tokenIndex}, current value ${JSON.stringify(current)}`);
						}
					}
					for (let element of leftValue) {
						validateRule(tokenIndex + 1, element);
					}
				} else {
					validateRule(tokenIndex + 1, leftValue);
				}
			};
			validateRule(0, value);
		}
	}

	parseValue(current, leftToken) {
		//console.log('PV', 'current', current, 'lt', typeof leftToken);
		if (current === undefined) {
			return undefined;
		} else if (leftToken === undefined) {
			return current;
		} else {
			return current[leftToken];
		}
	}

	parseEqual(leftValue, rightToken) {
		//console.log('PE', leftValue, rightToken);
		if (rightToken === undefined) {
			return leftValue !== undefined;
		} else {
			const tokens = rightToken.split('|');
			for (let token of tokens) {
				if (this.parseEqualToken(leftValue, token)) {
					return true;
				}
			}
			return false;
		}
	}

	parseEqualToken(value, token) {
		//console.log('PET', value, token);
		switch (token) {
		case 'int':
		case 'integer':
			return typeof value === 'number' && Number.isInteger(value);
		case 'number':
			return typeof value === 'number';
		case 'boolean':
			return typeof value === 'boolean';
		case 'string':
			return typeof value === 'string';
		case 'object':
			return value !== null && typeof value === 'object';
		case 'exists':
			return value !== null && value !== undefined;
		case 'null':
			return value === null;
		case 'undefined':
			return value === undefined;
		default:
			if (token.startsWith('<') && token.endsWith('>')) {
				const typeName = token.slice(1, -1);
				const type = this.types[typeName];
				if (type === undefined) {
					throw new Error(`type <${typeName}> does not exist`);
				} else {
					type.validate(value);
					return true;
				}
			}
			return value === String(token);
		}
	}
}

module.exports = Schema;
