PACKAGE="cognito-sso-client"

DEST="../cognito-sso-broker/node_modules/${PACKAGE}"

rm -rf $DEST

mkdir -p $DEST
cp -R package.json package-lock.json dist $DEST
#cp -R dist $DEST
