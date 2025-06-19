import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/de';
import 'dayjs/locale/it';
import 'dayjs/locale/pt';
import 'dayjs/locale/nl';
import 'dayjs/locale/ja';
import 'dayjs/locale/zh';
import 'dayjs/locale/ar';

dayjs.extend(localizedFormat);

export default dayjs;
